import { Layout } from "@pixi/layout";
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
export class BigButton extends FancyButton {
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
		defaultViewStart,
		defaultViewEnd,
		defaultViewCenter,
		hoverView,
		icon,
		defaultIconScale,
	}: {
		text?: string;
		hoverText?: string;
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
		const center = new TilingSprite({
			texture: Texture.from(defaultViewCenter || "big_button_center"),
			width: w,
			height: 256,
			x: 90,
		});
		const end = Sprite.from(defaultViewStart || "big_button_end");
		end.x = 90 + w;
		defaultView.addChild(
			Sprite.from(defaultViewEnd || "big_button_start"),
			center,
			end,
		);

		super({
			defaultView: defaultView,
			scale: scale || 0.33,
			icon,
			defaultIconScale,
			text: textElem,
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
