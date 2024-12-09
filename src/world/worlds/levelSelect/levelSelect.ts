import { World } from "world";
import { LevelWindow } from "./ui";
import { Graphics } from "graphics";
import { Rectangle } from "pixi.js";
import { WorldController } from "world/controller";
import { Level } from "@worlds/level";

export interface Levels {
	amtToDisplay: number;
	levels: { name: string }[];
}

const levels: Levels = await fetch("./levels/index.json").then((v) => v.json());
export class LevelSelect extends World {
	ui: LevelWindow;
	constructor(graphics: Graphics, worldController: WorldController) {
		super(graphics);
		for (const level of levels.levels) {
			fetch(`./levels/${level.name}.json`)
				.then((v) => v.text())
				.then((v) => {
					worldController.add(
						level.name,
						new Level(graphics, v, worldController, level.name),
					);
				});
		}
		this.ui = new LevelWindow(worldController, this.top);

		this.top.addChild(this.ui);
		this.recenter(graphics.renderer.screen);
	}
	recenter(screen: Rectangle): void {
		super.recenter(screen);
		this.ui.layout.resize(screen.width, screen.height);
	}
}
