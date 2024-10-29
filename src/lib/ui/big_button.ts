import { FancyButton } from "@pixi/ui";
import { Text } from "pixi.js";
export class BigButton extends FancyButton {
	constructor(text: string, onclick: () => void) {
		super({
			defaultView: "big_button",
			scale: 0.33,
			text: new Text({
				text,
				style: {
					fill: "white",
					fontSize: 150,
				},
			}),
		});

		super.addEventListener("pointerdown", onclick);
	}
}
