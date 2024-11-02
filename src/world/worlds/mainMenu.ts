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
		const settings = new SmallButton("⚙️", () =>
			worldController.set("settings"),
		);
		const play = new BigButton("Play", () => worldController.set("game"));

		this.layout = new Layout({
			content: [
				{
					id: "play",
					content: play,
					styles: {
						position: "center",
					},
				},
				{
					id: "settings",
					content: settings,
					styles: {
						position: "topRight",
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
