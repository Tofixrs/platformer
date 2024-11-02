import { Rectangle } from "pixi.js";
import { World } from "..";
import { Graphics } from "graphics";
import { Layout } from "@pixi/layout";
import { BigButton } from "@lib/ui/big_button";
import { SmallButton } from "@lib/ui/small_button";
import { WorldController } from "world/controller";

export class MainMenu extends World {
	layout: Layout;
	constructor(graphics: Graphics, worldController: WorldController) {
		super(graphics);
		this.layout = new Layout({
			content: [
				{
					id: "play",
					content: new BigButton("Play", () => worldController.set("game")),
					styles: {
						position: "center",
					},
				},
				{
					content: [
						{
							content: new SmallButton("⚙️", () =>
								worldController.set("settings"),
							),
							styles: {
								marginRight: 5,
							},
						},
						{
							content: new SmallButton("▶️", () =>
								worldController.set("level"),
							),
							styles: {
								marginRight: 5,
							},
						},
						{
							content: new SmallButton("🔧", () =>
								worldController.set("editor"),
							),
							styles: {
								marginRight: 5,
							},
						},
					],
					styles: {
						width: "100%",
						position: "top",
						margin: 10,
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
	}
	recenter(screen: Rectangle): void {
		this.layout.resize(screen.width, screen.height);
	}
}
