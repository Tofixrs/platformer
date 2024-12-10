import { Rectangle } from "pixi.js";
import { World } from "../..";
import { Graphics } from "graphics";
import { Vec2 } from "planck-js";
import { Actions } from "@lib/input";
import { Grid } from "./grid";
import { ObjectPlacer } from "./objectPlacer";
import { formatTime, meter } from "@lib/math/units";
import { EditorUi } from "./ui";
import { deserializeWorld, serializeWorld } from "@lib/serialize";
import { GOID } from "gameObject";
import { WorldController } from "world/controller";
import { CampaignUi } from "@worlds/campaign/ui";
import type { OneUp } from "@gameObjs/oneUp";
import type { Flag } from "@gameObjs/flag";

export class Editor extends World {
	screen: Rectangle = new Rectangle(0, 0);
	static gridSize = meter * 0.25;
	lastTime = 0;
	moveSpeed = 500;
	testing = false;
	rerender = false;
	grid: Grid;
	objectPlacer: ObjectPlacer = new ObjectPlacer(this);
	editorCamPos = new Vec2();
	data = "";
	worldControllerRef: WorldController;
	_lives = 3;
	_coins = 0;
	_time = 0;
	ui: EditorUi;
	gameUi = new CampaignUi();
	constructor(graphics: Graphics, worldControllerRef: WorldController) {
		super(graphics);
		this.main.x = 0;
		this.main.y = 0;
		this.grid = new Grid(
			new Vec2(this.main.pivot.x, this.main.pivot.y),
			graphics.renderer.screen,
		);
		this.worldControllerRef = worldControllerRef;

		this.ui = new EditorUi(this);
		this.gameUi.visible = false;
		this.top.addChild(this.ui);
		this.top.addChild(this.gameUi);

		this.main.addChild(this.grid.draw);
		this.recenter(graphics.renderer.screen);

		this.time = this._time;
		this.coins = this._coins;
		this.lives = this._lives;
	}
	update(dt: number): void {
		if (Actions.click("test") && !this.ui.dontInput) {
			this.setTesting(!this.testing);
		}

		if (this.isTesting(dt)) return;

		this.ui.onUpdate(dt);
		this.editorCamPos = new Vec2(this.main.pivot.x, this.main.pivot.y);
		this.objectPlacer.update(this.editorCamPos, this);
		this.moveViewBox(dt);
		if (this.rerender) {
			this.grid.render(this.editorCamPos, this.screen);
			this.rerender = false;
		}
		if (this.ui.levelData) {
			this.data = this.ui.levelData;
			this.load();
			this.ui.switchLoad();
			this.ui.levelData = undefined;
		}
	}
	isTesting(dt: number) {
		if (!this.testing) return false;

		super.update(dt);
		if (!this.pause) this.time += dt;

		this.entities
			.filter(
				(v) =>
					(v.goid == GOID.OneUp || v.goid == GOID.Coin) &&
					(v as OneUp).collected,
			)
			.forEach((v) => {
				if (v.goid == GOID.OneUp) {
					this.lives += 1;
				}
				if (v.goid == GOID.Coin) {
					this.coins += 1;
				}
				this.removeEntity(v.id);
			});
		if (this.coins >= 100) {
			this.coins -= 100;
			this.lives += 1;
		}
		if (
			this.entities.findIndex((v) => v.goid == GOID.Player) == -1 &&
			!this.entities.find((v) => v.goid == GOID.Flag && (v as Flag).win)
		) {
			if (--this.lives < 1) {
				this.setTesting(false);
				return false;
			}
			this.load();
			return true;
		}


		if (!this.entities.find((v) => v.goid == GOID.Flag && (v as Flag).winAnimDone)) return true;
		this.setTesting(false);

		return true;
	}
	fixedUpdate(): void {
		if (!this.testing) return;
		super.fixedUpdate();
	}
	moveViewBox(dt: number) {
		const currMoveSpeed = this.moveSpeed * dt;
		if (Actions.hold("jump")) {
			this.main.pivot.y -= currMoveSpeed;
			this.rerender = true;
		}
		if (Actions.hold("left")) {
			this.main.pivot.x -= currMoveSpeed;
			this.rerender = true;
		}
		if (Actions.hold("right")) {
			this.main.pivot.x += currMoveSpeed;
			this.rerender = true;
		}
		if (Actions.hold("crouch")) {
			this.main.pivot.y += currMoveSpeed;
			this.rerender = true;
		}
	}
	setTesting(yes: boolean) {
		if (yes) {
			this.grid.draw.clear();
			this.save();
		}
		this.testing = yes;
		this.objectPlacer.testing = yes;
		this.objectPlacer.mouseHandler.reset();
		this.ui.visible = !yes;
		this.gameUi.visible = yes;
		if (!yes /*no*/) {
			this.main.pivot.set(this.editorCamPos.x, this.editorCamPos.y);
			this.load();
			this.pause = false;
		}
		this.recenter(this.screen);
		this.lives = 3;
		this.coins = 0;
		this.time = 0;
	}
	recenter(screen: Rectangle): void {
		this.screen = screen;

		if (this.testing) {
			super.recenter(screen);
			return;
		} else {
			this.main.x = 0;
			this.main.y = 0;
		}
		this.rerender = true;
		this.ui.resize(screen.width, screen.height);
		this.gameUi.resize(screen.width, screen.height);
	}
	save() {
		this.data = serializeWorld(this);
	}
	load() {
		this.time = 0;
		this.coins = 0;
		for (let i = this.entities.length - 1; i != -1; i--) {
			this.removeEntityIndex(i, true);
		}
		const ent = deserializeWorld(this.data);
		ent.forEach((v) => this.addEntity(v));
	}
	get lives() {
		return this._lives;
	}
	set lives(lives: number) {
		this._lives = lives;
		this.gameUi.lives = lives;
	}
	get coins() {
		return this._coins;
	}
	set coins(coins: number) {
		this._coins = coins;
		this.gameUi.coins = coins;
	}

	set time(time: number) {
		this._time = time;
		this.gameUi.time = formatTime(time);
	}
	get time() {
		return this._time;
	}
}

export function getGridPosAtPos(pos: Vec2) {
	return new Vec2(
		Math.floor(pos.x / Editor.gridSize),
		Math.floor(pos.y / Editor.gridSize),
	);
}
export function getPosAtGrid(pos: Vec2) {
	return new Vec2(pos.x * Editor.gridSize, pos.y * Editor.gridSize);
}
