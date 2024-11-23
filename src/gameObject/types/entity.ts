import { World } from "world";
import { lerp, lerp2D } from "@lib/math/lerp";
import { planckToPixi } from "@lib/math/units";
import { Sprite } from "pixi.js";
import { Vec2 } from "planck-js";
import { PhysicsObject, PhysicsObjectOptions } from "./physicsObject";
export interface EntityOptions extends PhysicsObjectOptions {
	sprite: Sprite;
}

export class Entity extends PhysicsObject {
	sprite: Sprite;
	lastState?: PhysicsState;

	constructor(options: EntityOptions) {
		super(options);

		this.sprite = options.sprite;
		this.sprite.anchor.set(0.5, 0);

		const spritePos = planckToPixi(options.pos);
		this.sprite.x = spritePos.x;
		this.sprite.y = spritePos.y;
	}

	update(dt: number, _world: World): void {
		if (!this.lastState) {
			this.lastState = {
				pos: new Vec2(this.sprite.x, this.sprite.y),
				angle: this.sprite.angle,
			};
		}

		const lerpedPos = lerp2D(
			this.lastState?.pos,
			planckToPixi(this.pos),
			(dt / World.physicsStepTime),
		);
		const lerpedAngle = lerp(this.lastState.angle, this.body!.getAngle(), 1);
		this.sprite.x = lerpedPos.x;
		this.sprite.y = lerpedPos.y;
		this.sprite.rotation = lerpedAngle;
		this.lastState = {
			pos: new Vec2(this.sprite.x, this.sprite.y),
			angle: this.sprite.angle,
		};
	}
	create(world: World): void {
		super.create(world);

		world.main.addChild(this.sprite);
	}
	remove(world: World, force: boolean = false): boolean {
		super.remove(world, force);
		world.main.removeChild(this.sprite);
		return true;
	}
}

interface PhysicsState {
	pos: Vec2;
	angle: number;
}
