import { Layout } from "@pixi/layout";
import { ScrollBox } from "@pixi/ui";

export class Ui {
	layout: Layout;
	topScroll: ScrollBox;
	constructor() {
		this.layout = new Layout({});
	}
}
