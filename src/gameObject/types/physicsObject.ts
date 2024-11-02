import { GameObject, GameObjectOptions } from "gameObject";
import { World } from "world";
import { Body, Shape } from "planck-js";

export interface PhysicsObjectOptions extends GameObjectOptions {
	friction: number;
	shape: Shape;
	density: number;
	bodyType: "dynamic" | "static";
	fixedRotation: boolean;
}

export class PhysicsObject extends GameObject {
	friction: number;
	shape: Shape;
	density: number;
	bodyType: "dynamic" | "static";
	body!: Body;
	fixedRotation: boolean;
	lastDebugRender?: Shape;
	constructor(opts: PhysicsObjectOptions) {
		super(opts);

		this.bodyType = opts.bodyType;
		this.friction = opts.friction;
		this.density = opts.density;
		this.shape = opts.shape;
		this.fixedRotation = opts.fixedRotation;
	}
	fixedUpdate(): void {
		this.pos = this.body.getPosition();
	}

	create(world: World): void {
		this.body = world.p.createBody({
			position: this.pos,
			fixedRotation: this.fixedRotation,
			type: this.bodyType,
		});

		this.body.createFixture({
			density: this.density,
			shape: this.shape,
			friction: this.friction,
		});
	}
	remove(world: World): void {
		world.p.destroyBody(this.body);
	}
}
