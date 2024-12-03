import { FancyButton } from "@pixi/ui";
import { Text } from "pixi.js";
export class SmallButton extends FancyButton {
	constructor(text: string, hoverText: string, onclick: () => void) {
		const hover = new Text({
			text: hoverText,
			style: {
				align: "center",
				fontSize: 50,
			},
		});
		hover.visible = false;
		super({
			defaultView: "small_button",
			scale: 0.33,
			text: new Text({
				text,
				style: {
					fill: "white",
					fontSize: 150,
				},
			}),
		});
		this.addChild(hover);
		this.addEventListener("pointerover", () => {
			hover.visible = true;
		});
		this.addEventListener("pointerout", () => {
			hover.visible = false;
		});
		hover.y += 275;
		hover.x += 30;

		super.addEventListener("pointerdown", onclick);
	}
}
