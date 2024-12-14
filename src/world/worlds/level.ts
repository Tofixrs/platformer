import { Flag } from "@gameObjs/flag";
import { OneUp } from "@gameObjs/oneUp";
import { deserializeWorld } from "@lib/serialize";
import { GOID } from "gameObject";
import { Graphics } from "graphics";
import { World } from "world";
import { WorldController } from "world/controller";
import { Container, Rectangle, Text, TextStyle } from "pixi.js";
import { Screen } from "@lib/ui/screen";
import { Storage } from "@lib/storage";
import { formatTime } from "@lib/math/units";
import { Window } from "@lib/ui/Window";
import i18next from "i18next";
import { Content } from "@pixi/layout";
import { BigButton } from "@lib/ui/big_button";
import { Actions } from "@lib/input";
import { List } from "@pixi/ui";

export class Level extends World {
	loaded = false;
	done = false;
	worldControlRef: WorldController;
	data: string;
	_time: number = 2137;
	_coins = 0;
	ui: LevelUi;
	name?: string;
	constructor(
		graphics: Graphics,
		data: string,
		worldController: WorldController,
		name?: string,
	) {
		super(graphics);
		this.ui = new LevelUi(worldController);
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
		if (Actions.click("back")) {
			this.pause = !this.pause;
			this.ui.pauseWindow.visible = this.pause;
		}
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
			!this.entities.find((v) => v instanceof Flag && v.win)
		) {
			this.load();
			return;
		}
		if (!this.entities.find((v) => v instanceof Flag && v.winAnimDone)) return;

		if (this.name) {
			const bestTime = Storage.getNum(
				`${this.name}-bestTime`,
				Number.MAX_VALUE,
			);
			if (bestTime > this._time) {
				localStorage.setItem(`${this.name}-bestTime`, this._time.toString());
			}
		}
		this.worldControlRef.set("mainMenu");
		this.load();
	}

	load() {
		this.coins = 0;
		this.time = 0;
		this.colorMatrixDegrees = 0;
		this.colorMatrixBrightness = 0.5;
		this.colorMatrixBrightnessDir = 1;
		this.colorMatrixTimer.reset();
		for (let i = this.entities.length - 1; i != -1; i--) {
			this.removeEntityIndex(i, true);
		}
		const ent = deserializeWorld(this.data);
		ent.forEach((v) => {
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

export class LevelUi extends Screen {
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
	pauseWindow: PauseWindow;
	worldController: WorldController;
	constructor(worldController: WorldController) {
		super("level");
		this.worldController = worldController;
		this.pauseWindow = new PauseWindow(worldController, "mainMenu");
		this.addTop();
		this.addPause();
	}
	addPause() {
		this.addContent({
			content: this.pauseWindow,
			styles: {
				width: "100%",
				height: "100%",
			},
		});
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

export class PauseWindow extends Window<{
	exit: string;
	worldController: WorldController;
	onExit?: (self: PauseWindow) => void;
}> {
	exit: string;
	constructor(
		worldController: WorldController,
		exit: string,
		onExit?: (self: PauseWindow) => void,
	) {
		super({
			title: i18next.t("pause"),
			data: { exit, worldController, onExit },
		});
		this.exit = exit;
		this.visible = false;
	}
	createContent(data: {
		exit: string;
		worldController: WorldController;
		onExit?: (self: PauseWindow) => void;
	}): Content {
		this.exit = data.exit;
		const list = new List({
			type: "vertical",
			elementsMargin: 20,
			items: [
				new BigButton({
					text: i18next.t("unpause"),
					onClick: () => {
						data.worldController.world!.pause = false;
						this.visible = false;
					},
				}),
				new BigButton({
					text: i18next.t("exit"),
					onClick: () => {
						data.worldController.set(this.exit);
						if (data.onExit) data.onExit(this);
						this.visible = false;
					},
				}),
			],
		});
		return {
			content: new Container({ children: [list] }),
			styles: {
				position: "centerTop",
				padding: 100,
			},
		};
	}
}
