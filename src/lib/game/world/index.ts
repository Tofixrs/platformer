import { Application, Container, Ticker } from "pixi.js";
import { Entity } from "../entities";
import { World as PhysicsWorld, Vec2 } from "planck-js";
import { pixiToPlanckPos } from "@lib/math/units";

export class World {
	c: Container = new Container();
	p = new PhysicsWorld({
		gravity: new Vec2(0.0, 10.0),
	});
	entities: Entity[] = [];
	constructor(app: Application) {
		this.c.x = app.screen.width / 2;
		this.c.y = app.screen.height / 2;

		const canvas = app.renderer.canvas;
		new MutationObserver(() => {
			this.recenter(app);
		}).observe(canvas, {
			attributes: true,
			attributeFilter: ["width", "height"],
		});
	}
	addEntity<T extends Entity>(entity: T) {
		this.c.addChild(entity.sprite);

		const body = this.p.createBody({
			type: entity.bodyType,
			position: pixiToPlanckPos(new Vec2(entity.sprite.x, entity.sprite.y)),
			fixedRotation: true,
		});

		body.createFixture({
			shape: entity.shape,
			friction: entity.friction,
			density: entity.density,
			filterCategoryBits: entity.type == "ground" ? 10 : undefined,
		});

		entity.body = body;

		entity.onCreate(this);
		this.entities.push(entity);
	}

	update(ticker: Ticker) {
		this.p.step(1 / 60, 6, 2);
		this.entities.forEach((e) => e._update(ticker, this));
	}
	recenter(app: Application) {
		this.c.x = app.screen.width / 2;
		this.c.y = app.screen.height / 2;
	}
}
