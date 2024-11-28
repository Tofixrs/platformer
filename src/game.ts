import { Graphics } from "./graphics";
import { World } from "./world";
import { Actions } from "@lib/input";
import { MainMenu } from "@worlds/mainMenu";
import { Settings } from "@worlds/settings";
import { Editor } from "./world/worlds/editor";
import { Loop } from "@lib/loop";
import { WorldController } from "./world/controller";
import { Level } from "@worlds/level";
import { LevelSelect } from "@worlds/levelSelect/levelSelect";
import { Campaign } from "@worlds/campaign/campaign";

const levelData = await (await fetch("./levels/1-1.json")).text();

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

		const world = new Level(this.graphics, levelData, this.worldController);
		this.worldController.add("game", world);

		const editor = new Editor(this.graphics);
		this.worldController.add("editor", editor);

		this.worldController.set("mainMenu");

		const levelSelect = new LevelSelect(this.graphics, this.worldController);
		this.worldController.add("levelSelect", levelSelect);

		const campaign = new Campaign(this.graphics, this.worldController);
		this.worldController.add("campaign", campaign);
		this.loop.run();
	}
	update(dt: number) {
		if (Game.debug && this.worldController.world instanceof World) {
			this.graphics.debugRender(this.worldController.world!, dt);
		}

		if (Actions.click("debug")) {
			Game.debug = !Game.debug;
			Actions.debug = Game.debug;
			this.graphics.debugDraw.clear();
		}

		this.worldController.world?.update(dt);
		this.graphics.render();
	}
	fixedUpdate() {
		this.worldController.world?.fixedUpdate();
	}
}
