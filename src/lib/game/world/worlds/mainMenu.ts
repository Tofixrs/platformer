import { Rectangle } from "pixi.js";
import { World } from "..";
import { WorldManager } from "../manager";
import { ButtonContainer } from "@pixi/ui";
import { Button } from "@lib/game/ui/button";
import { Vec2 } from "planck-js";
import { Graphics } from "@lib/game/graphics";

export class MainMenu extends World {
	settingsButton: ButtonContainer;
	playButton: ButtonContainer;
	constructor(graphics: Graphics, worldManager: WorldManager) {
		super(graphics);
		this.c.x = 0;
		this.c.y = 0;
		this.settingsButton = Button({
			size: new Vec2(75, 75),
			color: 0xff0000,
			borderColor: 0x00ff00,
			content: "⚙️",
			borderRadius: 100,
		});

		this.playButton = Button({
			size: new Vec2(200, 75),
			color: 0xff0000,
			borderColor: 0x00ff00,
			content: "Play",
			borderRadius: 100,
		});

		this.playButton.onPress.connect(() => {
			worldManager.changeWorld("game");
		});
		this.settingsButton.onPress.connect(() => {
			worldManager.changeWorld("settings");
		});
		this.c.addChild(this.settingsButton, this.playButton);
		this.recenter(graphics.renderer.screen);
	}
	recenter(screen: Rectangle): void {
		this.playButton.x = screen.width / 2;
		this.playButton.y = screen.height / 2;
		this.settingsButton.x = screen.width - screen.width / 32;
		this.settingsButton.y = 30;
	}
}
