import { Layout } from "@pixi/layout";
import { FancyButton } from "@pixi/ui";
import { Container, Text, TextStyle, TextStyleOptions } from "pixi.js";

export class SmallButton extends FancyButton {
	hover = new Container({ zIndex: 2137 });
	hoverText: Text;
	forceActive = false;
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
		textStyle?: TextStyle | TextStyleOptions;
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
			pressedView: "small_button_hover",
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
				fill: "white",
			},
		});
		const layout = new Layout();
		layout.addContent({
			text: {
				content: this.hoverText,
				styles: {
					backgroundColor: "black",
					padding: 15,
					paddingLeft: 25,
					paddingRight: 25,
					borderRadius: 25,
				},
			},
		});
		this.hover.addChild(layout);
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
			if (this.hover.width + e.x > window.innerWidth) {
				this.hover.x -= this.hover.width;
			}
			if (this.hover.height + e.y > window.innerHeight) {
				this.hover.y -= this.hover.height;
			}
		});
	}
	setActive(yes: boolean) {
		if (yes) {
			this.setState("pressed");
			this.forceActive = true;
		} else {
			this.forceActive = false;
			this.setState("default");
		}
	}
	setState(
		newState: "default" | "hover" | "pressed" | "disabled",
		force?: boolean,
	): void {
		if (this.forceActive) return;
		super.setState(newState, force);
	}
}
