import { Ticker, Graphics as Draw } from "pixi.js";
import { Graphics } from "./graphics";
import { World } from "./world";
import { Actions } from "input";
import { Box, Vec2 } from "planck-js";
import { WorldManager } from "./world/manager";
import { MainMenu } from "./world/worlds/mainMenu";
import { Settings } from "./world/worlds/settings";
import { Player } from "./gameObjects/player";
import { Ground } from "./gameObjects/types/ground";

export class Game {
	static debug = false;
	graphics = new Graphics();
	worldManager!: WorldManager;
	ticker = new Ticker();
	constructor() {
		Actions.debug = Game.debug;
	}
	async run() {
		await this.graphics.setup();
		await this.graphics.preload();
		this.ticker.autoStart = true;

		this.worldManager = new WorldManager(
			this.graphics.stage,
			this.graphics.debugDraw,
		);
		const mainMenu = new MainMenu(this.graphics, this.worldManager);
		this.worldManager.addWorld("mainMenu", mainMenu);

		const settings = new Settings(this.graphics, this.worldManager);
		this.worldManager.addWorld("settings", settings);
		this.worldManager.changeWorld("settings");

		const world = new World(this.graphics);
		this.worldManager.addWorld("game", world);

		const player = new Player(new Vec2(0, 0));
		world.addEntity(player);

		const sprite = new Draw();
		sprite.rect(0, 0, 20 * 128, 128);
		sprite.fill({ color: 0x000000 });
		const box = new Ground({
			initPos: new Vec2(-10, 50),
			shape: new Box(20, 1),
			bodyType: "static",
			friction: 0.5,
			density: 0,
			fixedRotation: true,
		});
		world.addEntity(box);
		// world.addEntity(new Dummy(new Vec2(0, 0), world));

		this.ticker.add((ticker) => this.loop(ticker));
	}
	loop(ticker: Ticker) {
		if (Game.debug) {
			this.graphics.debugRender(this.worldManager.world!);
		}

		if (Actions.click("debug")) {
			Game.debug = !Game.debug;
			Actions.debug = Game.debug;
			this.graphics.debugDraw.clear();
		}

		this.worldManager.world?.update(ticker);
		this.graphics.render();
	}
}
