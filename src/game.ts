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
import { ViewController } from "view/controller";

export class Game {
	static debug = false;
	graphics = new Graphics();
	viewController!: ViewController;
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

		this.viewController = new ViewController(
			this.graphics.stage,
			this.graphics.debugDraw,
		);
		const mainMenu = new MainMenu(this.graphics, this.viewController);
		this.viewController.add("mainMenu", mainMenu);

		const settings = new Settings(this.graphics, this.viewController);
		this.viewController.add("settings", settings);

		const world = new World(this.graphics);
		this.viewController.add("game", world);

		const editor = new Editor(this.graphics);
		this.viewController.add("editor", editor);
		this.viewController.set("mainMenu");

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

		this.loop.run();
	}
	update(dt: number) {
		if (Game.debug && this.viewController.view instanceof World) {
			this.graphics.debugRender(this.viewController.view!, dt);
		}

		if (Actions.click("debug")) {
			Game.debug = !Game.debug;
			Actions.debug = Game.debug;
			this.graphics.debugDraw.clear();
		}

		this.viewController.view?.update(dt);
		this.graphics.render();
	}
	fixedUpdate() {
		this.viewController.view?.fixedUpdate();
	}
}
