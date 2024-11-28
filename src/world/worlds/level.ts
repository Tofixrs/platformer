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
	data: string;
	constructor(
		graphics: Graphics,
		data: string,
		worldController: WorldController,
		controlled: boolean = false,
	) {
		super(graphics);
		this.data = data;
		this.load();
		this.recenter(graphics.renderer.screen);
		this.controlled = controlled;
		this.worldControlRef = worldController;
	}
	update(dt: number): void {
		super.update(dt);
		if (
			this.entities.findIndex((v) => v.goid == GOID.Player) == -1 &&
			!this.flag?.win
		) {
			this.load();
			return;
		}
		if (!this.flag) return;
		if (!this.flag.winAnimDone) return;
		if (this.controlled) return;

		this.worldControlRef.set("mainMenu");
	}

	load() {
		for (let i = this.entities.length - 1; i != -1; i--) {
			this.removeEntityIndex(i, true);
		}
		const ent = deserializeWorld(this.data);
		ent.forEach((v) => {
			if (v.goid == GOID.Flag) this.flag = v as Flag;
			this.addEntity(v);
		});
	}
}
