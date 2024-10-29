import { Rectangle, Text, TextStyle } from "pixi.js";
import { World } from "..";
import { FancyButton } from "@pixi/ui";
import { Graphics } from "graphics";
import { Layout } from "@pixi/layout";
import { ViewController } from "view/controller";
import { BigButton } from "@lib/ui/big_button";
import { SmallButton } from "@lib/ui/small_button";

export class MainMenu extends World {
	layout: Layout;
	constructor(graphics: Graphics, viewController: ViewController) {
		super(graphics);
		const settings = new SmallButton("⚙️", () =>
			viewController.set("settings"),
		);
		const play = new BigButton("Play", () => viewController.set("game"));

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
