import { World } from "@lib/game/world";
import { lerp2D } from "@lib/math/lerp";
import { Container, Sprite, Texture, Ticker } from "pixi.js";
import { Entity } from ".";
import { Box, Fixture, Vec2 } from "planck-js";
import { planckToPixiPos } from "@lib/math/units";
import { Actions } from "input";

export class Player extends Entity {
	static maxJumpVel = 50;
	jumping = false;
	sensor!: Fixture;
	onGround = false;
	crouching = false;
	constructor(pos: Vec2, world: World) {
		super({
			friction: 0.2,
			shape: new Box(0.25, 0.5),
			density: 10,
			pos,
			sprite: Sprite.from("player_normal"),
			bodyType: "dynamic",
			world,
			type: "ent",
		});
		Actions.bind("jump", ["ArrowUp"]);
		Actions.bind("crouch", ["ArrowDown"]);
		Actions.bind("left", ["ArrowLeft"]);
		Actions.bind("right", ["ArrowRight"]);
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
		if (Actions.hold("crouch")) {
			this.jumping = false;
			return;
		}
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
			this.body?.applyForceToCenter(new Vec2(-25, 0), true);
		}

		if (
			Actions.actions.get("right") &&
			this.body!.getLinearVelocity().x < 7.5
		) {
			this.body?.applyForceToCenter(new Vec2(25, 0), true);
		}
	}
	handleCrouch() {
		if (Actions.hold("crouch")) {
			if (this.crouching) return;
			this.crouching = true;
			const shape = this.shape as Box;
			shape.m_vertices[0].y += 0.5;
			shape.m_vertices[3].y += 0.5;
			this.sprite.texture = Texture.from("player_crouch");
			this.sprite.anchor.set(0.5, 0);
		} else if (this.crouching) {
			const shape = this.shape as Box;
			shape.m_vertices[0].y -= 0.5;
			shape.m_vertices[3].y -= 0.5;
			this.crouching = false;
			this.sprite.texture = Texture.from("player_normal");
			this.sprite.anchor.set(0.5, 0.5);
		}
	}
	update(_ticker: Ticker, world: World): void {
		this.followCam(world.c);
		this.handleMove();
		this.handleCrouch();
	}
}
