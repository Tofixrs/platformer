import { Graphics } from "./graphics";
import { World } from "./world";
import { Actions } from "@lib/input";
import { Box, Vec2 } from "planck-js";
import { WorldManager } from "./world/manager";
import { MainMenu } from "./world/worlds/mainMenu";
import { Settings } from "./world/worlds/settings";
import { Player } from "@gameObjs/player";
import { Ground } from "@gameObjs/ground";
import { Editor } from "./world/worlds/editor";

export class Game {
	static debug = false;
	graphics = new Graphics();
	worldManager!: WorldManager;
	lastTime: number = 0;
	constructor() {
		Actions.debug = Game.debug;
	}
	async run() {
		await this.graphics.setup();
		await this.graphics.preload();
		Actions.init();

		this.worldManager = new WorldManager(
			this.graphics.stage,
			this.graphics.debugDraw,
		);
		const mainMenu = new MainMenu(this.graphics, this.worldManager);
		this.worldManager.addWorld("mainMenu", mainMenu);

		const settings = new Settings(this.graphics, this.worldManager);
		this.worldManager.addWorld("settings", settings);

		const world = new World(this.graphics);
		this.worldManager.addWorld("game", world);

		const editor = new Editor(this.graphics);
		this.worldManager.addWorld("editor", editor);
		this.worldManager.changeWorld("mainMenu");

		const player = new Player(new Vec2(0, 0));
		world.addEntity(player);

		const box = new Ground({
			initPos: new Vec2(-200, 50),
			shape: new Box(500, 0.5),
			bodyType: "static",
			friction: 0.5,
			density: 0,
			fixedRotation: true,
		});
		world.addEntity(box);
		// world.addEntity(new Dummy(new Vec2(0, 0), world));

		requestAnimationFrame((time) => {
			this.loop(time);
		});
	}
	loop(time: number) {
		const dt = (time - this.lastTime) / 1000;
		this.lastTime = time;

		if (Game.debug) {
			this.graphics.debugRender(this.worldManager.world!, dt);
		}

		if (Actions.click("debug")) {
			Game.debug = !Game.debug;
			Actions.debug = Game.debug;
			this.graphics.debugDraw.clear();
		}

		this.worldManager.world?.update(dt);
		this.graphics.render();
		requestAnimationFrame((time) => this.loop(time));
	}
}
