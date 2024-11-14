import { Container, Rectangle } from "pixi.js";
import { World as PhysicsWorld, Vec2 } from "planck-js";
import { Graphics } from "graphics";
import { GameObject } from "gameObject";

export class World {
	p = new PhysicsWorld({
		gravity: new Vec2(0.0, 50.0),
	});
	top = new Container();
	main = new Container();
	c = new Container();
	entities: GameObject[] = [];
	static physicsStepTime = 1 / 60;
	pause: boolean = false;
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

		this.c.addChild(this.main);
		this.c.addChild(this.top);
	}
	addEntity<T extends GameObject>(entity: T) {
		entity.create(this);
		this.entities.push(entity);
	}
	removeEntity(id: string, force: boolean = false) {
		const foundIndex = this.entities.findIndex((v) => {
			return v.id == id;
		});
		if (!this.entities[foundIndex]) return;
		if (this.entities[foundIndex].remove(this) || force) {
			this.entities.splice(foundIndex, 1);
		}
	}
	removeEntityIndex(index: number, force: boolean = false) {
		if (!this.entities[index]) return;
		this.entities[index].remove(this, force);
		this.entities.splice(index, 1);
	}

	update(dt: number) {
		if (this.pause) {
			this.entities.forEach((e) => e.pausedUpdate(dt, this));
			return;
		}
		this.entities.forEach((e) => e.update(dt, this));
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
}
