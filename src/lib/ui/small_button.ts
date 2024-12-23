import { FancyButton } from "@pixi/ui";
import { Container, Text, TextStyle, TextStyleOptions } from "pixi.js";
import { Tooltip, TooltipOptions } from "./tooltip";

export interface SmallButtonOptions {
	text?: string;
	hoverContainer?: Container;
	textStyle?: TextStyle | TextStyleOptions;
	scale?: number;
	onClick?: (self: SmallButton) => void;
	defaultView?: string;
	hoverView?: string | null;
	icon?: Container;
	defaultIconScale?: number;
	tooltipOptions?: TooltipOptions;
}

export class SmallButton extends FancyButton {
	forceActive = false;
	tooltip?: Tooltip;
	constructor({
		textStyle,
		text,
		hoverContainer,
		onClick,
		scale,
		defaultView,
		hoverView,
		icon,
		defaultIconScale,
		tooltipOptions,
	}: SmallButtonOptions) {
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
		if (tooltipOptions) {
			this.tooltip = new Tooltip(tooltipOptions);
			hoverContainer?.addChild(this.tooltip);
			this.addEventListener("pointerover", () => {
				this.tooltip!.visible = true;
			});
			this.addEventListener("pointerout", () => {
				this.tooltip!.visible = false;
			});
		}
		this.addEventListener("pointerdown", () => {
			if (onClick) onClick(this);
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
