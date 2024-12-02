import { Rectangle } from "pixi.js";
import { World } from "../..";
import { Graphics } from "graphics";
import { Vec2 } from "planck-js";
import { Actions } from "@lib/input";
import { Grid } from "./grid";
import { ObjectPlacer } from "./objectPlacer";
import { meter } from "@lib/math/units";
import { EditorUi } from "./ui";
import { deserializeWorld, serializeWorld } from "@lib/serialize";
import { GOID } from "gameObject";
import { OneUp } from "@gameObjs/oneUp";

export class Editor extends World {
	screen: Rectangle = new Rectangle(0, 0);
	static gridSize = meter * 0.25;
	lastTime = 0;
	moveSpeed = 500;
	testing = false;
	ui: EditorUi = new EditorUi(this);
	rerender = false;
	grid: Grid;
	objectPlacer: ObjectPlacer = new ObjectPlacer(this);
	editorCamPos = new Vec2();
	data = "";
	constructor(graphics: Graphics) {
		super(graphics);
		this.main.x = 0;
		this.main.y = 0;
		this.grid = new Grid(
			new Vec2(this.main.pivot.x, this.main.pivot.y),
			graphics.renderer.screen,
		);

		this.top.addChild(this.ui);
		this.main.addChild(this.grid.draw);
		this.recenter(graphics.renderer.screen);
	}
	update(dt: number): void {
		if (Actions.click("test") && !this.ui.dontInput) {
			this.setTesting(!this.testing);
		}
		if (this.testing) {
			super.update(dt);
			this.entities
				.filter((v) => v.goid == GOID.OneUp && (v as OneUp).collected)
				.forEach((v) => {
					this.removeEntity(v.id);
				});
			return;
		}
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
		if (!yes /*no*/) {
			this.main.pivot.set(this.editorCamPos.x, this.editorCamPos.y);
			this.load();
			this.pause = false;
		}
		this.recenter(this.screen);
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
	}
	save() {
		this.data = serializeWorld(this);
	}
	load() {
		for (let i = this.entities.length - 1; i != -1; i--) {
			this.removeEntityIndex(i, true);
		}
		const ent = deserializeWorld(this.data);
		ent.forEach((v) => this.addEntity(v));
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
