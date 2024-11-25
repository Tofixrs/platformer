import { deserializeWorld } from "@lib/serialize";
import { Graphics } from "graphics";
import { World } from "world";

export class Level extends World {
	constructor(graphics: Graphics, data?: string) {
		super(graphics);
		if (data) {
			this.load(data);
		}
		this.recenter(graphics.renderer.screen);
	}
	update(dt: number): void {
		super.update(dt);
	}

	load(data: string) {
		for (let i = this.entities.length - 1; i != -1; i--) {
			this.removeEntityIndex(i, true);
		}
		const ent = deserializeWorld(data);
		ent.forEach((v) => this.addEntity(v));
	}
}
