import { FancyButton } from "@pixi/ui";
import {
	Container,
	Sprite,
	Text,
	TextStyle,
	TextStyleOptions,
	Texture,
	TilingSprite,
} from "pixi.js";
import { Tooltip, TooltipOptions } from "./tooltip";
export class BigButton extends FancyButton {
	forceActive = false;
	tooltip?: Tooltip;
	constructor({
		textStyle,
		text,
		hoverContainer,
		onClick,
		scale,
		defaultViewStart,
		defaultViewEnd,
		defaultViewCenter,
		hoverViewStart,
		hoverViewCenter,
		hoverViewEnd,
		icon,
		defaultIconScale,
		tooltipOptions,
	}: {
		text?: string;
		hoverContainer?: Container;
		textStyle?: TextStyle | TextStyleOptions;
		scale?: number;
		onClick?: (self: BigButton) => void;
		defaultViewStart?: string;
		defaultViewEnd?: string;
		defaultViewCenter?: string;
		hoverView?: string | null;
		icon?: Container;
		defaultIconScale?: number;
		hoverViewStart?: string;
		hoverViewCenter?: string;
		hoverViewEnd?: string;
		tooltipOptions?: TooltipOptions;
	}) {
		const textElem = new Text({
			text,
			style: {
				fill: "white",
				fontSize: 150,
				...textStyle,
			},
		});

		const w = textElem.width > 332 ? textElem.width : 332;
		const defaultView = new Container();
		const defaultCenter = new TilingSprite({
			texture: Texture.from(defaultViewCenter || "big_button_center"),
			width: w,
			height: 256,
			x: 90,
		});
		const defaultEnd = Sprite.from(defaultViewStart || "big_button_end");
		defaultEnd.x = 90 + w;
		defaultView.addChild(
			Sprite.from(defaultViewEnd || "big_button_start"),
			defaultCenter,
			defaultEnd,
		);

		const hoverView = new Container();
		const hoverCenter = new TilingSprite({
			texture: Texture.from(hoverViewCenter || "big_button_center"),
			width: w,
			height: 256,
			x: 90,
		});
		const hoverEnd = Sprite.from(hoverViewStart || "big_button_end");
		hoverEnd.x = 90 + w;
		hoverView.addChild(
			Sprite.from(hoverViewEnd || "big_button_start"),
			hoverCenter,
			hoverEnd,
		);

		super({
			defaultView,
			hoverView,
			scale: scale || 0.33,
			icon,
			defaultIconScale,
			text: textElem,
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
