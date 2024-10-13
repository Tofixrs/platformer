import { Application, Container, Graphics as Draw } from "pixi.js";
import { World } from ".";

export class WorldManager {
	worlds: Map<string, World> = new Map();
	currentWorld: string = "main";
	worldContainer = new Container();
	debug: Draw;
	constructor(pixi: Application, debug: Draw) {
		pixi.stage.addChild(this.worldContainer);
		this.debug = debug;
	}
	addWorld(name: string, world: World) {
		this.worlds.set(name, world);
	}
	changeWorld(name: string) {
		if (this.world) {
			this.worldContainer.removeChild(this.world.c);
			this.world.c.removeChild(this.debug);
		}
		this.currentWorld = name;
		if (this.world) {
			this.worldContainer.addChild(this.world.c);
			this.world.c.addChild(this.debug);
		}
	}
	get world() {
		return this.worlds.get(this.currentWorld);
	}
}
