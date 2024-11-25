import { SmallButton } from "@lib/ui/small_button";
import { Window } from "@lib/ui/Window";
import { Content } from "@pixi/layout";
import { ScrollBox } from "@pixi/ui";
import { ContainerChild } from "pixi.js";
import { WorldController } from "world/controller";
import { Levels } from "./levelSelect";

const levelData: Levels = await fetch("./levels/index.json").then((v) =>
	v.json(),
);
export class LevelWindow extends Window {
	worldController: WorldController;
	constructor(worldController: WorldController) {
		super({
			title: "levels",
		});
		this.worldController = worldController;
	}
	createContent(): Content {
		return this.createLevelButtons();
	}
	createLevelButtons(): Content {
		return {
			levels: {
				content: new ScrollBox({
					width: 850,
					height: 650,
					items: this.levels,
					radius: 70,
					horPadding: 60,
					elementsMargin: 40,
				}),
				styles: {
					position: "center",
					width: "80%",
					height: "80%",
					zIndex: -20,
				},
			},
		};
	}
	private get levels() {
		const sprites: ContainerChild[] = [];

		for (let i = 0; i < levelData.amtToDisplay; i++) {
			if (levelData.levels[i]) {
				sprites.push(
					new SmallButton(levelData.levels[i].name, () =>
						this.worldController.set(levelData.levels[i].name),
					),
				);
			} else {
				sprites.push(new SmallButton("🔒", () => {}));
			}
		}
		return sprites;
	}
}
