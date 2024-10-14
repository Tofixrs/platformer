import { Ticker, Graphics as Draw, Sprite } from "pixi.js";
import { Graphics } from "./graphics";
import { World } from "./world";
import { Player } from "./entities/player";
import { Actions } from "input";
import { Box, Vec2 } from "planck-js";
import { Entity } from "./entities";
import { Dummy } from "./entities/dummy";
import { WorldManager } from "./world/manager";
import { MainMenu } from "./world/worlds/mainMenu";
import { Settings } from "./world/worlds/settings";

export class Game {
	static debug = false;
	graphics = new Graphics();
	player!: Player;
	worldManager!: WorldManager;
	constructor() {
		Actions.debug = Game.debug;
	}
	async run() {
		await this.graphics.setup();
		await this.graphics.preload();

		this.worldManager = new WorldManager(
			this.graphics.pixi,
			this.graphics.debugDraw,
		);
		const mainMenu = new MainMenu(this.graphics.pixi, this.worldManager);
		this.worldManager.addWorld("mainMenu", mainMenu);
		this.worldManager.changeWorld("mainMenu");

		const settings = new Settings(this.graphics.pixi, this.worldManager);
		this.worldManager.addWorld("settings", settings);

		const world = new World(this.graphics.pixi);
		this.worldManager.addWorld("game", world);

		this.player = new Player(new Vec2(0, 0), world);
		world.addEntity(this.player);

		const sprite = new Draw();
		sprite.rect(0, 0, 20 * 128, 128);
		sprite.fill({ color: 0x000000 });
		const box = new Entity({
			bodyType: "static",
			pos: new Vec2(-10, 500),
			type: "ground",
			density: 0.2,
			friction: 0.5,
			shape: new Box(20, 1),
			sprite: new Sprite(this.graphics.pixi.renderer.generateTexture(sprite)),
			world: world!,
		});
		world.addEntity(box);
		world.addEntity(new Dummy(new Vec2(0, 0), world));

		this.graphics.pixi.ticker.add((ticker) => this.loop(ticker));
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
	}
}
