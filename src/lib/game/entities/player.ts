import { World } from "@lib/game/world";
import { lerp2D } from "@lib/math/lerp";
import { Container, Sprite, Texture, Ticker } from "pixi.js";
import { Entity } from ".";
import { Box, Fixture, Vec2 } from "planck-js";
import { Actions } from "input";

export class Player extends Entity {
	maxJumpVel = -10;
	moveForce = 100;
	jumpPower = -750;
	maxMoveSpeed = 10;
	maxRollSpeed = 15;
	jumping = false;
	sensor!: Fixture;
	onGround = false;
	crouching = false;
	rolling = false;
	direction = 1;
	constructor(pos: Vec2, world: World) {
		super({
			friction: 0.2,
			shape: new Box(0.25, 0.5),
			density: 5,
			pos,
			sprite: Sprite.from("player_normal"),
			bodyType: "dynamic",
			world,
			type: "ent",
		});
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
		const { x, y } = lerp2D(
			world.pivot.x,
			world.pivot.y,
			this.sprite.x,
			this.sprite.y,
			0.25,
		);
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

		if (this.body!.getLinearVelocity().y < this.maxJumpVel) {
			this.jumping = false;
		}

		if (this.jumping) {
			this.body?.applyForce(new Vec2(0, this.jumpPower), new Vec2(0, -1), true);
		}
	}
	handleMove() {
		if (Actions.hold("left")) {
			this.direction = -1;
		}

		if (Actions.hold("right")) {
			this.direction = 1;
		}
		this.handleJump();
		this.handleCrouch();
		this.handleRoll();
		this.handleWalk();
	}
	handleWalk() {
		if (this.rolling) return;

		if (!Actions.hold("left") && !Actions.hold("right")) return;
		if (this.body!.getLinearVelocity().x * this.direction > this.maxMoveSpeed)
			return;
		this.body?.applyForceToCenter(
			new Vec2(this.moveForce * this.direction, 0),
			true,
		);
	}
	handleCrouch() {
		if (Actions.hold("crouch")) {
			if (this.crouching) return;
			this.crouching = true;
			this.setCrouchHitbox(true);
			this.sprite.texture = Texture.from("player_crouch");
			this.sprite.anchor.set(0.5, 0);
		} else if (this.crouching) {
			this.setCrouchHitbox(false);
			this.crouching = false;
			this.sprite.texture = Texture.from("player_normal");
			this.sprite.anchor.set(0.5, 0.5);
		}
		this.body?.setAwake(true);
	}
	handleRoll() {
		if (!Actions.hold("crouch") || !Actions.hold("roll") || !this.onGround) {
			if (this.rolling && (!Actions.hold("crouch") || !Actions.hold("roll"))) {
				this.body?.setFixedRotation(true);
				this.body?.setAngle(0);
				this.rolling = false;
				this.setRollSensorHitbox(false);
			}
			return;
		}

		this.rolling = true;
		this.body?.setFixedRotation(false);
		this.setRollSensorHitbox(true);
		if (this.body!.getLinearVelocity().x * this.direction > this.maxRollSpeed)
			return;

		//extra grav
		this.body?.applyForceToCenter(new Vec2(0, 1000), true);

		this.body?.applyForce(
			new Vec2(this.direction * this.moveForce, 0),
			new Vec2(0, 0.05),
			true,
		);
	}
	update(ticker: Ticker, world: World): void {
		this.followCam(world.c);
		this.handleMove();
	}
	setRollSensorHitbox(yes: boolean) {
		const shape = this.sensor.m_shape as Box;
		if (yes) {
			shape.m_vertices[0].x = 0.4;
			shape.m_vertices[0].y = -0.2;
			shape.m_vertices[1].x = 0.4;
			shape.m_vertices[1].y = 0.7;
			shape.m_vertices[2].x = -0.4;
			shape.m_vertices[2].y = 0.7;
			shape.m_vertices[3].x = -0.4;
			shape.m_vertices[3].y = -0.2;
		} else {
			shape.m_vertices[0].x = 0.2;
			shape.m_vertices[0].y = 0.4;
			shape.m_vertices[1].x = 0.2;
			shape.m_vertices[1].y = 0.62;
			shape.m_vertices[2].x = -0.2;
			shape.m_vertices[2].y = 0.62;
			shape.m_vertices[3].x = -0.2;
			shape.m_vertices[3].y = 0.4;
		}
	}
	setCrouchHitbox(yes: boolean) {
		const shape = this.shape as Box;
		if (yes) {
			shape.m_vertices[0].y = 0;
			shape.m_vertices[3].y = 0;
		} else {
			shape.m_vertices[0].y = -0.5;
			shape.m_vertices[3].y = -0.5;
		}
	}
}
