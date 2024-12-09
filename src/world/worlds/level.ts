import { Flag } from "@gameObjs/flag";
import { OneUp } from "@gameObjs/oneUp";
import { deserializeWorld } from "@lib/serialize";
import { GOID } from "gameObject";
import { Graphics } from "graphics";
import { World } from "world";
import { WorldController } from "world/controller";
import { Rectangle, Text, TextStyle } from "pixi.js";
import { Screen } from "@lib/ui/screen";
import { Storage } from "@lib/storage";
import { formatTime } from "@lib/math/units";

export class Level extends World {
	flag?: Flag;
	loaded = false;
	done = false;
	worldControlRef: WorldController;
	data: string;
	_time: number = 2137;
	_coins = 0;
	ui = new LevelUi();
	name?: string;
	constructor(
		graphics: Graphics,
		data: string,
		worldController: WorldController,
		name?: string,
	) {
		super(graphics);
		this.top.addChild(this.ui);
		this.data = data;
		this.load();
		this.recenter(graphics.renderer.screen);
		this.worldControlRef = worldController;
		this.time = this._time;
		this.coins = this._coins;
		this.name = name;
	}
	update(dt: number): void {
		super.update(dt);
		if (!this.pause) this.time += dt;
		this.entities
			.filter(
				(v) =>
					(v.goid == GOID.OneUp || v.goid == GOID.Coin) &&
					(v as OneUp).collected,
			)
			.forEach((v) => {
				if (v.goid == GOID.Coin) {
					this.coins += 1;
				}
				this.removeEntity(v.id);
			});
		if (
			this.entities.findIndex((v) => v.goid == GOID.Player) == -1 &&
			!this.flag?.win
		) {
			this.load();
			return;
		}
		if (!this.flag) return;
		if (!this.flag.winAnimDone) return;

		if (this.name) {
			const bestTime = Storage.getNum(
				`${this.name}-bestTime`,
				Number.MAX_VALUE,
			);
			if (bestTime < this._time) {
				localStorage.setItem(`${this.name}-bestTime`, this._time.toString());
			}
		}
		this.worldControlRef.set("mainMenu");
		this.load();
	}

	load() {
		this.coins = 0;
		this.time = 0;
		for (let i = this.entities.length - 1; i != -1; i--) {
			this.removeEntityIndex(i, true);
		}
		const ent = deserializeWorld(this.data);
		ent.forEach((v) => {
			if (v.goid == GOID.Flag) this.flag = v as Flag;
			this.addEntity(v);
		});
	}
	recenter(screen: Rectangle): void {
		super.recenter(screen);
		this.ui.resize(screen.width, screen.height);
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
}

class LevelUi extends Screen {
	timeText = new Text({
		text: "🕒 0:00",
		style: new TextStyle({
			fontSize: 50,
			dropShadow: true,
			fill: "#DDDDDD",
		}),
	});
	coinsText = new Text({
		text: "🪙 0",
		style: new TextStyle({
			fontSize: 50,
			dropShadow: true,
			fill: "#DDDDDD",
		}),
	});
	constructor() {
		super("level");
		this.addTop();
	}
	addTop() {
		this.addContent({
			topBar: {
				content: {
					coins: {
						content: this.coinsText,
						styles: {
							paddingLeft: 50,
							paddingRight: 50,
						},
					},
					timeCounter: {
						content: this.timeText,
						styles: {
							paddingLeft: 50,
							paddingRight: 50,
						},
					},
				},
				styles: {
					position: "centerTop",
					width: "100%",
					maxHeight: "10%",
					marginTop: 10,
				},
			},
		});
	}
	set time(time: string) {
		this.timeText.text = "🕒 " + time;
	}
	set coins(coins: number) {
		this.coinsText.text = "🪙 " + coins.toString();
	}
}
