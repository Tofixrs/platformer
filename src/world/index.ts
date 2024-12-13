import { ColorMatrixFilter, Container, Rectangle } from "pixi.js";
import { World as PhysicsWorld, Vec2 } from "planck-js";
import { Graphics } from "graphics";
import { GameObject } from "gameObject";
import { Timer } from "@lib/ticker";

export class World {
	p = new PhysicsWorld({
		gravity: new Vec2(0.0, 50.0),
	});
	top = new Container({ zIndex: 10 });
	main = new Container({ zIndex: 1 });
	bottom = new Container({ zIndex: -10 });
	c = new Container();
	entities: GameObject[] = [];
	static physicsStepTime = 1 / 60;
	pause: boolean = false;
	colorMatrixTimer = new Timer(10);
	colorMatrixDegrees = 0;
	colorMatrixBrightness = 0.5;
	colorMatrixBrightnessDir = 1;
	constructor(graphics: Graphics) {
		this.main.x = graphics.renderer.screen.width / 2;
		this.main.y = graphics.renderer.screen.height / 2;

		const canvas = graphics.renderer.canvas;
		new MutationObserver(() => {
			this.recenter(graphics.renderer.screen);
		}).observe(canvas, {
			attributes: true,
			attributeFilter: ["width", "height"],
		});

		this.c.addChild(this.top);
		this.c.addChild(this.bottom);
		this.c.addChild(this.main);
	}
	addEntity<T extends GameObject>(entity: T) {
		entity.create(this);
		this.entities.push(entity);
	}
	removeEntity(id: string, force: boolean = false, anim: boolean = false) {
		const foundIndex = this.entities.findIndex((v) => {
			return v.id == id;
		});
		if (!this.entities[foundIndex]) return;
		if (this.entities[foundIndex].remove(this, force, anim)) {
			this.entities.splice(foundIndex, 1);
		}
	}
	removeEntityIndex(index: number, force: boolean = false, anim: boolean = false) {
		if (!this.entities[index]) return;
		if (this.entities[index].remove(this, force, anim)) {
			this.entities.splice(index, 1);
		}
	}

	update(dt: number) {
		this.changeColorMatrix(dt);
		if (this.pause) {
			this.entities.forEach((e) => e.pausedUpdate(dt, this));
			return;
		}
		this.entities.forEach((e) => e.update(dt, this));
	}
	changeColorMatrix(dt: number) {
		this.colorMatrixTimer.tick(dt);
		if (this.colorMatrixTimer.done()) {
			this.colorMatrixTimer.reset();
			this.c.filters = [];
			return;
		}
		if (!Array.isArray(this.c.filters)) return;
		const colorMatrixFilter = this.c.filters.find(
			(v) => v instanceof ColorMatrixFilter,
		);
		if (colorMatrixFilter == undefined) return;
		this.colorMatrixDegrees += 50 * dt;
		this.colorMatrixBrightness += 1 * dt * this.colorMatrixBrightnessDir;
		if (this.colorMatrixDegrees > 1 || this.colorMatrixDegrees < 1) {
			this.colorMatrixBrightnessDir = -this.colorMatrixBrightnessDir;
		}
		this.colorMatrixBrightness += 0.1 * dt;
		colorMatrixFilter.hue(this.colorMatrixDegrees, false);
		colorMatrixFilter.brightness(this.colorMatrixBrightness, true);
	}
	fixedUpdate(): void {
		if (this.pause) return;
		this.p.step(World.physicsStepTime, 6, 2);
		this.entities.forEach((e) => e.fixedUpdate());
	}
	recenter(screen: Rectangle) {
		this.main.x = screen.width / 2;
		this.main.y = screen.height / 2;
	}
	onSet() {}
}
