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
		this.settingsButton = Button({
			size: new Vec2(200, 75),
			color: 0xff0000,
			borderColor: 0x00ff00,
			content: "⚙️asd",
			borderRadius: 100,
		});
		this.settingsButton.x += 100;
		this.recenter(graphics.renderer.screen);

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
	}
	recenter(screen: Rectangle): void {
		console.log(screen);
		super.recenter(screen);
		this.settingsButton.y = -screen.height + screen.height / 16;
	}
}
