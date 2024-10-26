import { Container, Rectangle } from "pixi.js";
import { World as PhysicsWorld, Vec2 } from "planck-js";
import { Graphics } from "graphics";
import { GameObject } from "gameObject";

export class World {
	top: Container = new Container();
	main: Container = new Container();
	c: Container = new Container();
	p = new PhysicsWorld({
		gravity: new Vec2(0.0, 50.0),
	});
	entities: GameObject[] = [];
	accumulator = 0;
	static physicsStepTime = 1 / 60;
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

	update(dt: number) {
		this.accumulator += dt;
		while (this.accumulator >= World.physicsStepTime) {
			this.p.step(World.physicsStepTime, 6, 2);
			this.accumulator -= World.physicsStepTime;
			this.entities.forEach((e) => e.fixedUpdate());
		}

		this.entities.forEach((e) => {
			e.update(dt, this);
		});
	}
	recenter(screen: Rectangle) {
		this.main.x = screen.width / 2;
		this.main.y = screen.height / 2;
	}
}
