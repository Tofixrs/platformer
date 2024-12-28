import { World } from ".";
import { Graphics } from "graphics";

export class WorldController {
	worlds: Map<string, World> = new Map();
	currentWorld: string = "";
	graphicsRef: Graphics;
	constructor(graphics: Graphics) {
		this.graphicsRef = graphics;
	}
	add(name: string, world: World) {
		this.worlds.set(name, world);
	}
	set(name: string) {
		if (this.world) {
			this.world.main.removeChild(this.graphicsRef.debugDraw);
			this.world.top.removeChild(this.graphicsRef.fpsElem);
		}
		this.currentWorld = name;
		if (this.world) {
			this.graphicsRef.stage = this.world.c;

			//@ts-expect-error
			globalThis.__PIXI_STAGE__ = this.world.c;
			this.world.main.addChild(this.graphicsRef.debugDraw);
			this.world.top.addChild(this.graphicsRef.fpsElem);
			this.world.onSet();
		}
	}
	get world() {
		return this.worlds.get(this.currentWorld);
	}
}
