import { Flag } from "@gameObjs/flag";
import { Player, PState } from "@gameObjs/player";
import { deserializeWorld } from "@lib/serialize";
import { GOID } from "gameObject";
import { Graphics } from "graphics";
import { World } from "world";
import { WorldController } from "world/controller";
import { CampaignUi } from "./ui";
import { Rectangle } from "pixi.js";
import { OneUp } from "@gameObjs/oneUp";
import { Coin } from "@gameObjs/coin";
import { Storage } from "@lib/storage";
import { formatTime } from "@lib/math/units";
import { Actions } from "@lib/input";
import { PauseWindow } from "@worlds/level";

const levels = await fetch("./levels/index.json")
	.then((v) => v.json())
	.then((v) => v.levels as { name: string }[])
	.then((v) =>
		Promise.all(
			v.map((v) =>
				(async () => {
					return { name: v.name, data: await fetch(`./levels/${v.name}.json`) };
				})(),
			),
		),
	)
	.then((v) =>
		Promise.all(
			v.map((v) =>
				(async () => {
					return {
						name: v.name,
						data: await v.data.text(),
					};
				})(),
			),
		),
	);

export class Campaign extends World {
	levels: { name: string; data: string }[] = levels;
	levelTimes: { name: string; time: number }[] = [];
	currLevel = 0;
	worldControllerRef: WorldController;
	playerPState?: PState;
	player?: Player;
	_lives = 3;
	_coins = 0;
	_time = 0;
	campaignTime = 0;
	ui: CampaignUi;
	constructor(graphics: Graphics, worldControllerRef: WorldController) {
		super(graphics);
		const won = localStorage.getItem("win") == "true";
		this.ui = new CampaignUi(
			worldControllerRef,
			won ? "levelSelect" : "mainMenu",
		);
		this.worldControllerRef = worldControllerRef;
		this.top.addChild(this.ui);
		this.recenter(graphics.renderer.screen);

		this.ui.coins = this.coins;
		this.ui.lives = this.lives;
	}
	update(dt: number): void {
		if (Actions.click("back")) {
			this.pause = !this.pause;
			this.ui.pauseWindow.visible = this.pause;
		}
		super.update(dt);
		if (!this.pause) {
			this.campaignTime += dt;
			this.time += dt;
		}
		this.entities
			.filter(
				(v) =>
					(v.goid == GOID.OneUp || v.goid == GOID.Coin) &&
					(v as OneUp).collected,
			)
			.forEach((v) => {
				if (v instanceof OneUp) {
					this.lives += 1;
				}
				if (v instanceof Coin) {
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
			!this.entities.find((v) => v instanceof Flag && v.win)
		) {
			this.playerPState = undefined;
			this.lives--;
			if (this.lives < 1) {
				this.worldControllerRef.set("mainMenu");
				this.reset();
				return;
			}
			this.load();
			return;
		}
		this.playerPState = this.player?.powerState;
		if (!this.entities.find((v) => v instanceof Flag && v.winAnimDone)) return;

		const name = this.levels[this.currLevel].name;
		const bestTime = Storage.getNum(`${name}-bestTime`, Number.MAX_VALUE);
		if (this.time < bestTime) {
			localStorage.setItem(`${name}-bestTime`, this.time.toString());
		}
		this.levelTimes.push({ name, time: this.time });
		this.currLevel += 1;
		this.load();
	}
	reset() {
		this.playerPState = undefined;
		this.load();
		this.lives = 3;
		this.coins = 0;
		this.time = 0;
		this.campaignTime = 0;
		this.colorMatrixDegrees = 0;
		this.colorMatrixBrightness = 0.5;
		this.colorMatrixBrightnessDir = 1;
		this.colorMatrixTimer.reset();
	}
	onSet(): void {
		this.lives = 3;
		this.currLevel = 0;
		this.time = 0;
		this.coins = 0;
		this.campaignTime = 0;
		this.playerPState = undefined;
		this.colorMatrixDegrees = 0;
		this.colorMatrixBrightness = 0.5;
		this.colorMatrixBrightnessDir = 1;
		this.colorMatrixTimer.reset();
		const won = localStorage.getItem("win") == "true";
		this.ui.pauseWindow.exit = won ? "levelSelect" : "mainMenu";
		this.load();
		if (!this.levels[this.currLevel]) {
			this.worldControllerRef.set("mainMenu");
		}
	}
	get lives() {
		return this._lives;
	}
	set lives(lives: number) {
		this._lives = lives;
		this.ui.lives = lives;
	}
	get coins() {
		return this._coins;
	}
	set coins(coins: number) {
		this._coins = coins;
		this.ui.coins = coins;
	}

	set time(time: number) {
		this._time = time;
		this.ui.time = formatTime(time);
	}
	get time() {
		return this._time;
	}
	won() {
		this.worldControllerRef.set("mainMenu");
		localStorage.setItem("win", "true");
		this.playerPState = undefined;
		this.lives = 3;
		this.coins = 0;

		const campaignTime = Storage.getNum("campaign-bestTime", Number.MAX_VALUE);
		if (this.campaignTime < campaignTime) {
			localStorage.setItem("campaign-bestTime", this.campaignTime.toString());
		}
	}
	load() {
		this.time = 0;
		this.c.filters = [];
		this.colorMatrixDegrees = 0;
		this.colorMatrixBrightness = 0.5;
		this.colorMatrixBrightnessDir = 1;
		this.colorMatrixTimer.reset();
		if (!this.levels[this.currLevel]) {
			this.won();
			return;
		}
		for (let i = this.entities.length - 1; i != -1; i--) {
			this.removeEntityIndex(i, true);
		}
		const ent = deserializeWorld(this.levels[this.currLevel].data);
		ent.forEach((v) => {
			this.addEntity(v);
			if (v.goid == GOID.Player) {
				const p = v as Player;
				const moveDown =
					window.innerHeight > 540 ? window.innerHeight * 0.25 : 0;
				this.main.pivot = p.sprite.position;
				this.main.pivot.y -= moveDown;
				if (this.playerPState) {
					p.setPState(this.playerPState, this, false);
				}
				this.player = p;
			}
		});
	}
	recenter(screen: Rectangle): void {
		super.recenter(screen);
		this.ui.resize(screen.width, screen.height);
	}
}
