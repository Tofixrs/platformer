import { GameObject, GameObjectOptions } from "@lib/game/gameObject";
import { World } from "@lib/game/world";
import { Body, Shape, Vec2 } from "planck-js";

export interface PhysicsObjectOptions extends GameObjectOptions {
	friction: number;
	shape: Shape;
	density: number;
	initPos: Vec2;
	bodyType: "dynamic" | "static";
	fixedRotation: boolean;
}

export class PhysicsObject extends GameObject {
	friction: number;
	shape: Shape;
	density: number;
	initPos: Vec2;
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
		this.initPos = opts.initPos;
		this.fixedRotation = opts.fixedRotation;
	}

	create(world: World): void {
		this.body = world.p.createBody({
			position: this.initPos,
			fixedRotation: this.fixedRotation,
			type: this.bodyType,
		});

		this.body.createFixture({
			density: this.density,
			shape: this.shape,
			friction: this.friction,
		});
	}
}
