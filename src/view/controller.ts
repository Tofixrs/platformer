import { Container, Graphics as Draw } from "pixi.js";
import { View } from ".";

export class ViewController {
	worlds: Map<string, View> = new Map();
	currentWorld: string = "";
	worldContainer = new Container();
	debug: Draw;
	constructor(stage: Container, debug: Draw) {
		stage.addChild(this.worldContainer);
		this.debug = debug;
	}
	add(name: string, view: View) {
		this.worlds.set(name, view);
	}
	set(name: string) {
		if (this.view) {
			this.worldContainer.removeChild(this.view.c);
			this.view.main.removeChild(this.debug);
		}
		this.currentWorld = name;
		if (this.view) {
			this.worldContainer.addChild(this.view.c);
			this.view.main.addChild(this.debug);
		}
	}
	get view() {
		return this.worlds.get(this.currentWorld);
	}
}
