import { Application } from "pixi.js";
import { World } from "..";
import { WorldManager } from "../manager";
import { ButtonContainer } from "@pixi/ui";
import { Button } from "@lib/game/ui/button";
import { Vec2 } from "planck-js";

export class MainMenu extends World {
	settingsButton: ButtonContainer;
	playButton: ButtonContainer;
	constructor(app: Application, worldManager: WorldManager) {
		super(app);
		this.settingsButton = Button({
			size: new Vec2(75, 75),
			color: 0xff0000,
			borderColor: 0x00ff00,
			content: "⚙️",
			borderRadius: 100,
		});
		this.recenter(app);

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
	recenter(app: Application): void {
		super.recenter(app);
		this.settingsButton.x = app.screen.width / 2 - 100;
		this.settingsButton.y = -app.screen.height / 2 + 50;
	}
}
