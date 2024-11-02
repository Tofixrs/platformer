import { Rectangle } from "pixi.js";
import { World as PhysicsWorld, Vec2 } from "planck-js";
import { Graphics } from "graphics";
import { GameObject } from "gameObject";
import { View } from "view";

export class World extends View {
	p = new PhysicsWorld({
		gravity: new Vec2(0.0, 50.0),
	});
	entities: GameObject[] = [];
	static physicsStepTime = 1 / 60;
	constructor(graphics: Graphics) {
		super();
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
	removeEntity<T extends GameObject>(entity: T, i: number) {
		entity.remove(this);
		this.entities.splice(i, 1);
	}

	update(dt: number) {
		this.entities.forEach((e) => e.update(dt, this));
	}
	fixedUpdate(): void {
		this.p.step(World.physicsStepTime, 6, 2);
		this.entities.forEach((e) => e.fixedUpdate());
	}
	recenter(screen: Rectangle) {
		this.main.x = screen.width / 2;
		this.main.y = screen.height / 2;
	}
}
