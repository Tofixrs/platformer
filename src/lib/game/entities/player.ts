import { World } from "@lib/game/world";
import { lerp2D } from "@lib/math/lerp";
import { Container, Sprite, Ticker } from "pixi.js";
import { Entity } from ".";
import { Box, Fixture, Vec2 } from "planck-js";
import { planckToPixiPos } from "@lib/math/units";
import { Actions } from "input";

export class Player extends Entity {
	static maxJumpVel = 50;
	jumping = false;
	sensor!: Fixture;
	onGround = false;
	constructor(pos: Vec2, world: World) {
		super({
			friction: 0.2,
			shape: new Box(0.25, 0.5),
			density: 10,
			pos,
			sprite: Sprite.from("player"),
			bodyType: "dynamic",
			world,
			type: "ent",
		});
		Actions.bind("jump", [" "]);
		Actions.bind("left", ["a", "A"]);
		Actions.bind("right", ["D", "d"]);
		Actions.bind("down", ["s", "S"]);
	}
	onCreate(world: World) {
		this.sensor = this.body!.createFixture({
			shape: new Box(0.2, 0.1, new Vec2(0, 0.52)),
			isSensor: true,
			filterMaskBits: 10,
		});

		world.p.on("begin-contact", (contact) => {
			const fixA = contact.getFixtureA();
			const fixB = contact.getFixtureB();

			if (fixA != this.sensor && fixB != this.sensor) return;

			this.onGround = contact.isTouching();
		});

		world.p.on("end-contact", (contact) => {
			const fixA = contact.getFixtureA();
			const fixB = contact.getFixtureB();

			if (fixA != this.sensor && fixB != this.sensor) return;

			this.onGround = contact.isTouching();
		});
	}
	followCam(world: Container) {
		const pos = planckToPixiPos(this.body!.getPosition());
		const { x, y } = lerp2D(world.pivot.x, world.pivot.y, pos.x, pos.y, 1);
		world.pivot.set(x, y);
	}
	handleJump() {
		if (Actions.actions.get("jump") && this.onGround) {
			this.jumping = true;
		}
		if (!Actions.actions.get("jump")) {
			this.jumping = false;
		}

		if (this.body!.getLinearVelocity().y < -7.5) {
			this.jumping = false;
		}

		if (this.jumping) {
			this.body?.applyForce(new Vec2(0, -200), new Vec2(0, -1), true);
		}
	}
	handleMove() {
		this.handleJump();

		if (
			Actions.actions.get("left") &&
			this.body!.getLinearVelocity().x > -7.5
		) {
			this.body?.applyForceToCenter(new Vec2(-50, 0), true);
		}

		if (
			Actions.actions.get("right") &&
			this.body!.getLinearVelocity().x < 7.5
		) {
			this.body?.applyForceToCenter(new Vec2(50, 0), true);
		}
	}
	update(ticker: Ticker, world: World): void {
		this.followCam(world.c);
		this.handleMove();
	}
}
