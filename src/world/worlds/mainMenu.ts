import { Rectangle, Sprite } from "pixi.js";
import { World } from "..";
import { Graphics } from "graphics";
import { Layout } from "@pixi/layout";
import { BigButton } from "@lib/ui/big_button";
import { WorldController } from "world/controller";
import { Level } from "./level";
import { Paralax } from "@gameObjs/paralax";
import { SmallButton } from "@lib/ui/small_button";
import i18next from "i18next";
import { GOID } from "gameObject";

export class MainMenu extends World {
	layout: Layout;
	constructor(graphics: Graphics, worldController: WorldController) {
		super(graphics);
		this.layout = new Layout({
			content: [
				{
					content: [
						{
							content: Sprite.from("title"),
							styles: {
								position: "center",
								padding: 100,
								paddingBottom: 300,
							},
						},
						{
							content: new BigButton("Play", "", () => {
								if (localStorage.getItem("win") == "true") {
									worldController.set("levelSelect");
								} else {
									worldController.set("campaign");
								}
							}),
							styles: {
								position: "bottomCenter",
							},
						},
					],
					styles: {
						position: "center",
					},
				},
				{
					content: [
						{
							content: new SmallButton({
								text: "⚙️",
								hoverText: i18next.t("settings"),
								hoverContainer: this.top,
								onClick(self) {
									self.hover.visible = false;
									worldController.set("settings");
								},
							}),
							styles: {
								marginRight: 5,
							},
						},
						{
							content: new SmallButton({
								text: "▶️",
								hoverText: i18next.t("levelLoad"),
								hoverContainer: this.top,
								onClick: (self) => {
									navigator.clipboard.readText().then((v) => {
										const level = new Level(graphics, v, worldController);
										worldController.add("level", level);
										worldController.set("level");
										self.hover.visible = false;
									});
								},
							}),
							styles: {
								marginRight: 5,
							},
						},
						{
							content: new SmallButton({
								text: "🔧",
								hoverText: i18next.t("editor"),
								hoverContainer: this.top,
								onClick(self) {
									self.hover.visible = false;
									worldController.set("editor");
								},
							}),
							styles: {
								marginRight: 5,
							},
						},
					],
					styles: {
						width: "100%",
						position: "top",
						margin: 10,
						zIndex: 9999999,
					},
				},
			],
			styles: {
				width: "100%",
				height: "100%",
			},
		});
		this.top.addChild(this.layout);
		this.recenter(graphics.renderer.screen);
		this.addEntity(new Paralax());
	}
	//hack lol
	onSet(): void {
		const paralax = this.entities.find(
			(v) => v.goid == GOID.Paralax,
		) as Paralax;
		paralax.fg.anchor.x = 1;
		paralax.bg.anchor.x = 1;

		paralax.fg.anchor.x = 0;
		paralax.bg.anchor.x = 0;
	}
	recenter(screen: Rectangle): void {
		this.layout.resize(screen.width, screen.height);
	}
}
