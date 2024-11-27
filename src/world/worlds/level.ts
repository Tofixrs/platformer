import { Flag } from "@gameObjs/flag";
import { deserializeWorld } from "@lib/serialize";
import { GOID } from "gameObject";
import { Graphics } from "graphics";
import { World } from "world";
import { WorldController } from "world/controller";

export class Level extends World {
	flag?: Flag;
	loaded = false;
	done = false;
	controlled: boolean;
	worldControlRef: WorldController;
	constructor(
		graphics: Graphics,
		data: string,
		worldController: WorldController,
		controlled: boolean = false,
	) {
		super(graphics);
		this.load(data);
		this.recenter(graphics.renderer.screen);
		this.controlled = controlled;
		this.worldControlRef = worldController;
	}
	update(dt: number): void {
		super.update(dt);
		if (this.loaded && !this.flag) {
			this.flag = this.entities.find((v) => v.goid == GOID.Flag) as Flag;
		}
		if (!this.flag) return;
		if (!this.flag.winAnimDone) return;
		this.flag.winAnimDone = true;
		if (this.controlled) return;

		this.worldControlRef.set("mainMenu");
	}

	load(data: string) {
		for (let i = this.entities.length - 1; i != -1; i--) {
			this.removeEntityIndex(i, true);
		}
		const ent = deserializeWorld(data);
		ent.forEach((v) => this.addEntity(v));
		this.loaded = true;
	}
}
