import { Container, Rectangle, Ticker } from "pixi.js";
import { World as PhysicsWorld, Vec2 } from "planck-js";
import { Graphics } from "../graphics";
import { GameObject } from "../gameObject";

export class World {
	c: Container = new Container();
	p = new PhysicsWorld({
		gravity: new Vec2(0.0, 50.0),
	});
	entities: GameObject[] = [];
	accumulator = 0;
	static physicsStepTime = 1 / 60;
	constructor(graphics: Graphics) {
		this.c.x = graphics.renderer.screen.width / 2;
		this.c.y = graphics.renderer.screen.height / 2;

		const canvas = graphics.renderer.canvas;
		new MutationObserver(() => {
			this.recenter(graphics.renderer.screen);
		}).observe(canvas, {
			attributes: true,
			attributeFilter: ["width", "height"],
		});
	}
	addEntity<T extends GameObject>(entity: T) {
		entity.create(this);
		this.entities.push(entity);
	}

	update(ticker: Ticker) {
		this.accumulator += ticker.elapsedMS / 1000;
		while (this.accumulator >= World.physicsStepTime) {
			this.p.step(1 / 60, 6, 2);
			this.accumulator -= World.physicsStepTime;
			this.entities.forEach((e) => e.fixedUpdate());
		}

		this.entities.forEach((e) => {
			e.update(ticker, this);
		});
	}
	recenter(screen: Rectangle) {
		this.c.x = screen.width / 2;
		this.c.y = screen.height / 2;
	}
}
