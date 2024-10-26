import { Container } from "pixi.js";

export class View {
	top: Container = new Container();
	main: Container = new Container();
	c: Container = new Container();
	constructor() {
		this.c.addChild(this.main);
		this.c.addChild(this.top);
	}
	update(_dt: number) {}
	fixedUpdate() {}
}
