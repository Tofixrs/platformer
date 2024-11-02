import { Graphics } from "./graphics";
import { World } from "./world";
import { Actions } from "@lib/input";
import { Box, Vec2 } from "planck-js";
import { MainMenu } from "@worlds/mainMenu";
import { Settings } from "@worlds/settings";
import { Player } from "@gameObjs/player";
import { Ground } from "@gameObjs/ground";
import { Editor } from "./world/worlds/editor";
import { Loop } from "@lib/loop";
import { WorldController } from "./world/controller";

export class Game {
	static debug = false;
	graphics = new Graphics();
	worldController!: WorldController;
	loop: Loop = new Loop({
		update: (dt) => this.update(dt),
		fixedUpdate: () => this.fixedUpdate(),
	});
	constructor() {
		Actions.debug = Game.debug;
	}
	async run() {
		await this.graphics.setup();
		await this.graphics.preload();
		Actions.init();

		this.worldController = new WorldController(
			this.graphics.stage,
			this.graphics.debugDraw,
		);
		const mainMenu = new MainMenu(this.graphics, this.worldController);
		this.worldController.add("mainMenu", mainMenu);

		const settings = new Settings(this.graphics, this.worldController);
		this.worldController.add("settings", settings);

		const world = new World(this.graphics);
		this.worldController.add("game", world);

		const editor = new Editor(this.graphics);
		this.worldController.add("editor", editor);
		this.worldController.set("mainMenu");

		const player = new Player(new Vec2(0, 0));
		world.addEntity(player);

		const box = new Ground({
			pos: new Vec2(-200, 50),
			shape: new Box(500, 0.5),
			bodyType: "static",
			friction: 0.5,
			density: 0,
			fixedRotation: true,
		});
		world.addEntity(box);
		// world.addEntity(new Dummy(new Vec2(0, 0), world));

		this.loop.run();
	}
	update(dt: number) {
		if (Game.debug && this.worldController.view instanceof World) {
			this.graphics.debugRender(this.worldController.view!, dt);
		}

		if (Actions.click("debug")) {
			Game.debug = !Game.debug;
			Actions.debug = Game.debug;
			this.graphics.debugDraw.clear();
		}

		this.worldController.view?.update(dt);
		this.graphics.render();
	}
	fixedUpdate() {
		this.worldController.view?.fixedUpdate();
	}
}
