import { Window } from "@lib/ui/Window";
import { Content } from "@pixi/layout";
import { ScrollBox } from "@pixi/ui";
import { Container, ContainerChild } from "pixi.js";
import { WorldController } from "world/controller";
import { Levels } from "./levelSelect";
import { SmallButton } from "@lib/ui/small_button";
import i18next from "i18next";
import { Storage } from "@lib/storage";
import { formatTime } from "@lib/math/units";

const levelData: Levels = await fetch("./levels/index.json").then((v) =>
	v.json(),
);
export class LevelWindow extends Window<Container> {
	worldController: WorldController;
	top: Container;
	constructor(worldController: WorldController, top: Container) {
		super({
			title: i18next.t("levels"),
			data: top,
		});
		this.worldController = worldController;
		this.top = top;
	}
	createContent(data: Container<ContainerChild>): Content {
		this.top = data;
		return this.createLevelButtons();
	}
	createLevelButtons(): Content {
		return {
			levels: {
				content: {
					scroll: {
						content: new ScrollBox({
							width: 900,
							height: 550,
							items: this.levels,
							radius: 70,
							horPadding: 60,
							elementsMargin: 30,
						}),
						styles: {
							height: "70%",
						},
					},
					bot: {
						content: {
							btns: {
								content: [
									new SmallButton({
										text: "❌",
										hoverText: i18next.t("back"),
										hoverContainer: this.top,
										onClick: () => this.worldController.set("mainMenu"),
									}),
								],
								styles: {
									position: "centerRight",
									paddingRight: 100,
								},
							},
						},
						styles: {
							width: "100%",
						},
					},
				},
				styles: {
					width: "100%",
					height: "100%",
					marginTop: 25,
					zIndex: -20,
					padding: 50,
				},
			},
		};
	}
	private get levels() {
		const sprites: ContainerChild[] = [];

		for (let i = 0; i < levelData.amtToDisplay; i++) {
			if (levelData.levels[i]) {
				const time = Storage.getNum(`${levelData.levels[i].name}-bestTime`, -1);
				sprites.push(
					new SmallButton({
						text: levelData.levels[i].name,
						hoverText:
							time == -1
								? undefined
								: i18next.t("bestTime", { time: formatTime(time) }),
						hoverContainer: this.top,
						onClick: () => {
							this.worldController.set(levelData.levels[i].name);
						},
					}),
				);
			} else {
				sprites.push(
					new SmallButton({
						text: "🔒",
						hoverText: i18next.t("locked"),
						hoverContainer: this.top,
					}),
				);
			}
		}
		return sprites;
	}
}
