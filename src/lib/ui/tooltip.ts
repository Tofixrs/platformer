import { ConditionalStyles, Layout, Styles } from "@pixi/layout";
import { Text, TextStyle, TextStyleOptions } from "pixi.js";

export interface TooltipOptions {
	text: string;
	textStyle?: TextStyle | TextStyleOptions;
	layoutStyle?: Styles & ConditionalStyles;
	above?: boolean;
}

export class Tooltip extends Layout {
	text: Text;
	constructor({ text, textStyle, layoutStyle, above = false }: TooltipOptions) {
		super();
		this.text = new Text({
			text,
			style: {
				fontSize: 20,
				fill: "white",
				...textStyle,
			},
		});
		this.addContent({
			text: {
				content: this.text,
				styles: {
					backgroundColor: "black",
					padding: 15,
					paddingLeft: 25,
					paddingRight: 25,
					borderRadius: 25,
					...layoutStyle,
				},
			},
		});
		this.zIndex = 2137;
		this.visible = false;
		window.addEventListener("pointermove", (e) => {
			this.x = e.x;
			this.y = above ? e.y - 20 - this.height : e.y + 20;
			if (this.width + e.x > window.innerWidth) {
				this.x -= this.width;
			}
			if (this.height + e.y > window.innerHeight) {
				this.y -= this.height;
			}
			if (e.y - 20 - this.height < window.innerHeight) {
				this.y = e.y + 20;
			}
		});
	}
}
