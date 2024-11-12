import { GameObject, GameObjectID, GameObjectOptions } from "gameObject";
import { World } from "world";
import { Body, BodyType, Fixture, Shape } from "planck-js";

export interface PhysicsObjectOptions extends GameObjectOptions {
	friction: number;
	shape: Shape;
	density: number;
	bodyType: BodyType;
	fixedRotation: boolean;
}

export class PhysicsObject extends GameObject {
	friction: number;
	shape: Shape;
	density: number;
	bodyType: BodyType;
	body!: Body;
	fixedRotation: boolean;
	lastDebugRender?: Shape;
	mainFix!: Fixture;
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

		this.mainFix = this.body.createFixture({
			density: this.density,
			shape: this.shape,
			friction: this.friction,
			userData: {
				goid: this.goid,
				id: this.id,
			},
		});
	}
	remove(world: World, force: boolean = false): boolean {
		world.p.destroyBody(this.body);
		return true;
	}
}

export interface PhysObjUserData {
	goid: GameObjectID;
	id: string;
}
