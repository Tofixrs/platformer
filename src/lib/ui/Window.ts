import { Content, Styles } from "@pixi/layout";
import { Sprite } from "pixi.js";
import { Screen } from "./screen";

export class Window<T> extends Screen {
	constructor({
		title,
		styles,
		ribbonStyle,
		data,
	}: {
		title: string;
		styles?: Styles;
		ribbonStyle?: Styles;
		data?: T;
	}) {
		super(title, styles);
		this.addContent({
			content: {
				ribbon: {
					content: {
						content: title,
						styles: {
							position: "center",
							color: "white",
							fontSize: 90,
						},
					},
					styles: {
						background: Sprite.from("big_button"),
						position: "centerTop",
						marginTop: -20,
						...ribbonStyle,
						maxHeight: "10%",
					},
				},
				c: this.createContent(data!),
			},
			styles: {
				position: "center",
				background: Sprite.from("window"),
				maxWidth: "100%",
				maxHeight: "100%",
			},
		});
	}
	createContent(data: T): Content {
		return [];
	}
}
