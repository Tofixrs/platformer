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

const levels = await fetch("./levels/index.json")
	.then((v) => v.json())
	.then((v) => v.levels as { name: string }[])
	.then((v) => Promise.all(v.map((v) => fetch(`./levels/${v.name}.json`))))
	.then((v) => Promise.all(v.map((v) => v.text())));

export class Campaign extends World {
	levels: string[] = levels;
	currLevel = 0;
	flag?: Flag;
	worldControllerRef: WorldController;
	playerPState?: PState;
	player?: Player;
	_lives = 3;
	_coins = 0;
	ui = new CampaignUi();
	constructor(graphics: Graphics, worldControllerRef: WorldController) {
		super(graphics);
		this.worldControllerRef = worldControllerRef;
		this.top.addChild(this.ui);
		this.recenter(graphics.renderer.screen);

		this.ui.coins = this.coins;
		this.ui.lives = this.lives;
	}
	update(dt: number): void {
		super.update(dt);

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
			!this.flag?.win
		) {
			this.playerPState = undefined;
			this.lives--;
			if (this.lives < 1) {
				this.worldControllerRef.set("mainMenu");
				return;
			}
			this.load();
			return;
		}
		this.playerPState = this.player?.powerState;
		if (!this.flag?.winAnimDone) return;

		this.currLevel += 1;
		this.load();
	}
	onSet(): void {
		this.lives = 3;
		this.currLevel = 0;
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
	won() {
		this.worldControllerRef.set("mainMenu");
		localStorage.setItem("win", "true");
	}
	load() {
		if (!this.levels[this.currLevel]) {
			this.won();
			return;
		}
		for (let i = this.entities.length - 1; i != -1; i--) {
			this.removeEntityIndex(i, true);
		}
		const ent = deserializeWorld(this.levels[this.currLevel]);
		ent.forEach((v) => {
			this.addEntity(v);
			if (v.goid == GOID.Flag) this.flag = v as Flag;
			if (v.goid == GOID.Player) {
				if (this.playerPState) {
					(v as Player).setPState(this.playerPState, this, false);
				}
				this.player = v as Player;
			}
		});
	}
	recenter(screen: Rectangle): void {
		super.recenter(screen);
		this.ui.resize(screen.width, screen.height);
	}
}
