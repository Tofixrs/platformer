import { World } from "@lib/game/world";
import { lerp, lerp2D } from "@lib/math/lerp";
import { planckToPixiPos } from "@lib/math/units";
import { Sprite, Ticker } from "pixi.js";
import { Vec2 } from "planck-js";
import { PhysicsObject, PhysicsObjectOptions } from "./physicsObject";
interface EntityOptions extends PhysicsObjectOptions {
	sprite: Sprite;
}

export class Entity extends PhysicsObject {
	sprite: Sprite;
	lastState?: PhysicsState;

	constructor(options: EntityOptions) {
		super(options);

		this.sprite = options.sprite;
		this.sprite.anchor.set(0.5, 0);

		const spritePos = planckToPixiPos(options.initPos);
		this.sprite.x = spritePos.x;
		this.sprite.y = spritePos.y;
	}

	update(ticker: Ticker, _world: World): void {
		if (!this.lastState) {
			this.lastState = {
				pos: new Vec2(this.sprite.x, this.sprite.y),
				angle: this.sprite.angle,
			};
		}

		const lerpedPos = lerp2D(
			this.lastState?.pos,
			planckToPixiPos(this.body!.getPosition()),
			ticker.deltaMS / (World.physicsStepTime * 1000),
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

		world.c.addChild(this.sprite);
	}
}

interface PhysicsState {
	pos: Vec2;
	angle: number;
}
