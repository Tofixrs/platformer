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
import { BigButton } from "@lib/ui/big_button";

const levelData: Levels = await fetch("./levels/index.json").then((v) =>
	v.json(),
);
export class LevelWindow extends Window<{ top: Container; scroll: ScrollBox }> {
	worldController: WorldController;
	top: Container;
	scroll!: ScrollBox;
	constructor(worldController: WorldController, top: Container) {
		const scroll = new ScrollBox({
			width: 900,
			height: 550,
			items: [],
			radius: 70,
			horPadding: 60,
			elementsMargin: 30,
		});
		super({
			title: i18next.t("levels"),
			data: {
				top,
				scroll,
			},
		});
		this.worldController = worldController;
		this.top = top;
		this.scroll = scroll;
	}
	createContent(data: { top: Container; scroll: ScrollBox }): Content {
		this.top = data.top;
		this.scroll = data.scroll;
		return this.createLevelButtons();
	}
	createLevelButtons(): Content {
		const time = Storage.getNum("campaign-bestTime", -1);

		return {
			levels: {
				content: {
					scroll: {
						content: this.scroll,
						styles: {
							height: "70%",
						},
					},
					bot: {
						content: {
							btnsLeft: {
								content: [
									new BigButton({
										text: "Replay",
										hoverText: i18next.t("bestTime", {
											time: formatTime(time),
										}),
										hoverContainer: time == -1 ? undefined : this.top,
										onClick: () => this.worldController.set("campaign"),
									}),
								],
								styles: {
									position: "centerLeft",
									paddingRight: 100,
								},
							},
							btnsRight: {
								content: [
									new SmallButton({
										text: "❌",
										hoverText: i18next.t("back"),
										hoverContainer: this.top,
										onClick: (self) => {
											self.hover.visible = false;
											this.worldController.set("mainMenu");
										},
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
	refreshContent() {
		this.scroll.removeItems();
		this.scroll.addItems(this.levels);
	}
	private get levels() {
		const sprites: ContainerChild[] = [];

		for (let i = 0; i < levelData.amtToDisplay; i++) {
			if (levelData.levels[i]) {
				const time = Storage.getNum(`${levelData.levels[i].name}-bestTime`, -1);
				sprites.push(
					new SmallButton({
						text: levelData.levels[i].name,
						hoverText: i18next.t("bestTime", { time: formatTime(time) }),
						hoverContainer: time == -1 ? undefined : this.top,
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
