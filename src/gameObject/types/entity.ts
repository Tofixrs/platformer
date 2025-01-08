import { World } from "world";
import { lerp, lerp2D } from "@lib/math/lerp";
import { planckToPixi } from "@lib/math/units";
import { Sprite } from "pixi.js";
import { Vec2 } from "planck";
import { PhysicsObject, PhysicsObjectOptions } from "./physicsObject";
export interface EntityOptions extends PhysicsObjectOptions {
	sprite: Sprite;
}

export class Entity extends PhysicsObject {
	sprite: Sprite;
	lastState?: Vec2;

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
			this.lastState = new Vec2(this.sprite.x, this.sprite.y);
		}

		const lerpedPos = lerp2D(
			this.lastState,
			planckToPixi(this.pos),
			Math.min(dt / World.physicsStepTime, 1),
		);
		this.sprite.x = lerpedPos.x;
		this.sprite.y = lerpedPos.y;
		this.sprite.rotation = this.body.getAngle();
		this.lastState = new Vec2(this.sprite.x, this.sprite.y);
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
			filterCategoryBits: 0b10,
			userData: {
				goid: this.goid,
				id: this.id,
			},
		});

		world.main.addChild(this.sprite);
	}
	remove(world: World, force: boolean = false): boolean {
		super.remove(world, force);
		world.main.removeChild(this.sprite);
		return true;
	}
}
