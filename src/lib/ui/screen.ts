import { Layout, Styles } from "@pixi/layout";

export class Screen extends Layout {
	constructor(id: string, styles?: Styles) {
		super({
			id,
			styles: {
				width: "100%",
				height: "100%",
				...styles,
			},
		});
	}

	public onUpdate(dt: number) {}
}
