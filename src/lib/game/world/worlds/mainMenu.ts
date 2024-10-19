import { Rectangle, Graphics as Draw } from "pixi.js";
import { World } from "..";
import { WorldManager } from "../manager";
import { FancyButton } from "@pixi/ui";
import { Graphics } from "@lib/game/graphics";
import { Layout } from "@pixi/layout";

export class MainMenu extends World {
	layout: Layout;
	constructor(graphics: Graphics, worldManager: WorldManager) {
		super(graphics);
		this.c.x = 0;
		this.c.y = 0;
		const settings = new FancyButton({
			defaultView: "settingsBtn",
		});
		settings.onPress.connect(() => {
			worldManager.changeWorld("settings");
		});

		const play = new FancyButton({
			defaultView: "playBtn",
		});
		play.onPress.connect(() => {
			worldManager.changeWorld("game");
		});

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
		this.c.addChild(this.layout);
		this.recenter(graphics.renderer.screen);
	}
	recenter(screen: Rectangle): void {
		this.layout.resize(screen.width, screen.height);
	}
}
