import { Ticker, Graphics as Draw, Sprite } from "pixi.js";
import { Graphics } from "./graphics";
import { World } from "./world";
import { Player } from "./entities/player";
import { Actions } from "input";
import { Box, Vec2 } from "planck-js";
import { Entity } from "./entities";
import { Dummy } from "./entities/dummy";
import { WorldManager } from "./world/manager";

export class Game {
	static debug = true;
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

		Actions.bind("debug", ["`"]);
		const world = new World(this.graphics.pixi);
		this.worldManager = new WorldManager(
			this.graphics.pixi,
			this.graphics.debugDraw,
		);
		this.worldManager.addWorld("main", world);
		this.worldManager.changeWorld("main");
		this.player = new Player(new Vec2(0, 0), world);
		this.worldManager.world?.addEntity(this.player);

		const sprite = new Draw();
		sprite.rect(0, 0, 640 * 2, 64 * 10);
		sprite.fill({ color: 0x000000 });
		const box = new Entity({
			bodyType: "static",
			pos: new Vec2(-10, 500),
			type: "ground",
			density: 1,
			friction: 1,
			shape: new Box(10, 5),
			sprite: new Sprite(this.graphics.pixi.renderer.generateTexture(sprite)),
			world: this.worldManager.world!,
		});
		this.worldManager.world?.addEntity(box);
		this.worldManager.world?.addEntity(
			new Dummy(new Vec2(0, 0), this.worldManager.world),
		);

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
