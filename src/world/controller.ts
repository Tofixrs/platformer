import { Container, Graphics as Draw } from "pixi.js";
import { World } from ".";

export class WorldController {
	worlds: Map<string, World> = new Map();
	currentWorld: string = "";
	worldContainer = new Container();
	debug: Draw;
	constructor(stage: Container, debug: Draw) {
		stage.addChild(this.worldContainer);
		this.debug = debug;
		this.debug.zIndex = 21;
	}
	add(name: string, world: World) {
		this.worlds.set(name, world);
	}
	set(name: string) {
		if (this.world) {
			this.worldContainer.removeChild(this.world.c);
			this.world.main.removeChild(this.debug);
		}
		this.currentWorld = name;
		if (this.world) {
			this.worldContainer.addChild(this.world.c);
			this.world.main.addChild(this.debug);
			this.world.onSet();
		}
	}
	get world() {
		return this.worlds.get(this.currentWorld);
	}
}
