import { FancyButton } from "@pixi/ui";
import { Container, Text, TextStyle } from "pixi.js";
// export class SmallButton extends FancyButton {
// 	constructor(text: string, hoverText: string, onclick: () => void) {
// 		const hover = new Text({
// 			text: hoverText,
// 			style: {
// 				align: "center",
// 				fontSize: 50,
// 			},
// 		});
// 		hover.visible = false;
// 		super({
// 			defaultView: "small_button",
// 			scale: 0.33,
// 			text: new Text({
// 				text,
// 				style: {
// 					fill: "white",
// 					fontSize: 150,
// 				},
// 			}),
// 		});
// 		this.addChild(hover);
// 		this.addEventListener("pointerover", () => {
// 			hover.visible = true;
// 		});
// 		this.addEventListener("pointerout", () => {
// 			hover.visible = false;
// 		});
// 		hover.y += 275;
// 		hover.x += 30;
//
// 		super.addEventListener("pointerdown", onclick);
// 	}
// }

export class SmallButton extends FancyButton {
	hover = new Container({ zIndex: 2137 });
	hoverText: Text;
	constructor({
		textStyle,
		text,
		hoverText,
		hoverContainer,
		onClick,
		scale,
		defaultView,
		hoverView,
		icon,
		defaultIconScale,
	}: {
		text?: string;
		hoverText?: string;
		hoverContainer?: Container;
		textStyle?: TextStyle;
		scale?: number;
		onClick?: (self: SmallButton) => void;
		defaultView?: string;
		hoverView?: string | null;
		icon?: Container;
		defaultIconScale?: number;
	}) {
		super({
			defaultView: defaultView || "small_button",
			hoverView: hoverView === undefined ? "small_button_hover" : undefined,
			scale: scale || 0.33,
			icon,
			defaultIconScale,
			text: new Text({
				text,
				style: {
					fill: "white",
					fontSize: 150,
					...textStyle,
				},
			}),
		});
		this.hoverText = new Text({
			text: hoverText,
			style: {
				fontSize: 20,
			},
		});
		this.hover.addChild(this.hoverText);
		this.hover.visible = false;
		hoverContainer?.addChild(this.hover);
		this.addEventListener("pointerover", () => {
			this.hover.visible = true;
		});
		this.addEventListener("pointerout", () => {
			this.hover.visible = false;
		});
		this.addEventListener("pointerdown", () => {
			if (onClick) onClick(this);
		});
		this.addEventListener("pointermove", (e) => {
			this.hover.x = e.x;
			this.hover.y = e.y + 20;
		});
	}
}
