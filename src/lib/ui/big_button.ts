import { FancyButton } from "@pixi/ui";
import { Text } from "pixi.js";
export class BigButton extends FancyButton {
	constructor(text: string, hoverText: string, onclick: () => void) {
		const hover = new Text({ text: hoverText });
		hover.visible = false;
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
		this.addChild(hover);
		this.on("hover", (v) => {
			hover.visible = true;
		});
		this.on("out", (v) => {
			hover.visible = false;
		});

		super.addEventListener("pointerdown", onclick);
	}
}
