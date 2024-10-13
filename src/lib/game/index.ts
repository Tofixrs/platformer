import { Ticker, Graphics as Draw, Sprite } from "pixi.js";
import { Graphics } from "./graphics";
import { World } from "./world";
import { Player } from "./entities/player";
import { Actions } from "input";
import { Box, Vec2 } from "planck-js";
import { Entity } from "./entities";
import { Dummy } from "./entities/dummy";

export class Game {
	static debug = false;
	world!: World;
	graphics = new Graphics();
	player!: Player;
	constructor() {
		Actions.debug = Game.debug;
	}
	async run() {
		await this.graphics.setup();
		await this.graphics.preload();

		this.world = new World(this.graphics.pixi);
		this.player = new Player(new Vec2(0, 0), this.world);
		this.world.c.addChild(this.graphics.debugDraw);

		this.world.addEntity(this.player);

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
			world: this.world,
		});
		this.world.addEntity(box);
		this.world.addEntity(new Dummy(new Vec2(0, 0), this.world));

		this.graphics.pixi.ticker.add((ticker) => this.loop(ticker));
	}
	loop(ticker: Ticker) {
		if (Game.debug) {
			this.graphics.debugRender(this.world);
		}

		if (Actions.actions.get("switchWorld")) {
		}

		this.world.update(ticker);
	}
}
