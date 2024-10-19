import { Box, Contact, Fixture, Vec2 } from "planck-js";
import { Sprite, Texture, Ticker } from "pixi.js";
import { Entity } from "./types/entity";
import { World } from "../world";
import { lerp2D } from "@lib/math/lerp";
import { Actions } from "input";

export class Player extends Entity {
	maxJumpVel = -20;
	moveForce = 5000;
	rollForce = 1000;
	jumpPower = -40000;
	maxMoveSpeed = 15;
	maxRollSpeed = 25;
	groundpoundSpeed = 15;
	jumping = false;
	sensor!: Fixture;
	onGround = false;
	crouching = false;
	rolling = false;
	pounding = false;
	direction = 1;
	constructor(pos: Vec2) {
		super({
			initPos: pos,
			friction: 0.2,
			density: 5,
			shape: new Box(0.25, 0.5),
			sprite: Sprite.from("player_normal"),
			bodyType: "dynamic",
			fixedRotation: true,
		});
	}
	create(world: World): void {
		super.create(world);
		this.sensor = this.body.createFixture({
			shape: new Box(0.2, 0.1, new Vec2(0, 0.52)),
			isSensor: true,
			filterMaskBits: 10,
		});

		world.p.on("begin-contact", (contact) => {
			this.checkSensorContact(contact);
		});

		world.p.on("end-contact", (contact) => {
			this.checkSensorContact(contact);
		});
	}

	checkSensorContact(contact: Contact) {
		const fixA = contact.getFixtureA();
		const fixB = contact.getFixtureB();

		if (fixA != this.sensor && fixB != this.sensor) return;

		this.onGround = contact.isTouching();
	}
	update(ticker: Ticker, world: World): void {
		super.update(ticker, world);
		this.followCam(world);
		this.handleMove(ticker);
	}
	followCam(world: World) {
		const pos = lerp2D(
			new Vec2(world.c.pivot.x, world.c.pivot.y),
			new Vec2(this.sprite.x, this.sprite.y),
			0.1,
		);
		world.c.pivot.set(pos.x, pos.y);
	}
	handleMove(ticker: Ticker) {
		if (Actions.hold("left")) {
			this.direction = -1;
		}

		if (Actions.hold("right")) {
			this.direction = 1;
		}
		this.handleJump(ticker);
		this.handleCrouch();
		this.handleRoll(ticker);
		this.handleGroundpound(ticker);
		this.handleWalk(ticker);
	}
	handleJump(ticker: Ticker) {
		if (Actions.actions.get("jump") && this.onGround) {
			this.jumping = true;
		}

		if (!Actions.actions.get("jump")) {
			this.jumping = false;
		}

		if (this.body!.getLinearVelocity().y < this.maxJumpVel) {
			this.jumping = false;
			this.body?.setLinearVelocity(
				new Vec2(this.body.getLinearVelocity().x, this.maxJumpVel),
			);
		}
		if (!this.jumping) return;

		this.body?.applyForce(
			new Vec2(0, this.jumpPower * (ticker.deltaMS / 1000)),
			new Vec2(0, -1),
			true,
		);
	}

	handleCrouch() {
		if (this.pounding) return;

		this.crouching = Actions.hold("crouch") || false;
		this.setCrouchHitbox(this.crouching);
		this.sprite.texture = Texture.from(
			this.crouching ? "player_crouch" : "player_normal",
		);
		this.sprite.anchor.set(0.5, this.crouching ? 0 : 0.5);
	}

	handleRoll(ticker: Ticker) {
		const shouldRoll = !!Actions.hold("crouch") && !!Actions.hold("roll");

		if (this.rolling && !shouldRoll) {
			this.body.setFixedRotation(true);
			this.body.setAngle(0);
			this.setRollSensorHitbox(false);
		} else if (!this.rolling && shouldRoll && this.onGround) {
			this.body.setFixedRotation(false);
			this.setRollSensorHitbox(true);
		}
		this.rolling = this.rolling ? shouldRoll : shouldRoll && this.onGround;

		if (!this.rolling) return;

		if (this.body!.getLinearVelocity().x * this.direction > this.maxRollSpeed) {
			this.body.setLinearVelocity(
				new Vec2(
					this.maxRollSpeed * this.direction,
					this.body.getLinearVelocity().y,
				),
			);
			return;
		}

		this.body?.applyForceToCenter(
			new Vec2(0, 25 * (ticker.deltaMS / 1000)),
			true,
		);
		this.body?.applyForce(
			new Vec2(this.direction * this.rollForce * (ticker.deltaMS / 1000), 0),
			new Vec2(0, 0.05),
			true,
		);
	}

	handleGroundpound(ticker: Ticker) {
		if (this.rolling) return;

		if (Actions.click("groundpound") && !this.onGround) {
			this.pounding = true;
			this.sprite.texture = Texture.from("player_crouch");

			this.sprite.anchor.set(0.5, 0.5);
			this.setCrouchHitbox(true);
		}
		if (this.onGround && !Actions.hold("crouch")) {
			this.pounding = false;
			this.body?.setGravityScale(1);
			this.sprite.texture = Texture.from("player_normal");

			this.sprite.anchor.set(0.5, 0.5);
			this.setCrouchHitbox(false);
		}

		if (!this.pounding) return;

		this.body?.setLinearVelocity(
			new Vec2(0, (this.groundpoundSpeed * ticker.deltaMS) / 1000),
		);
		this.body?.setGravityScale(0);
	}
	handleWalk(ticker: Ticker) {
		if (this.rolling) return;
		if (this.pounding) return;

		if (!Actions.hold("left") && !Actions.hold("right")) return;
		if (this.body!.getLinearVelocity().x * this.direction > this.maxMoveSpeed)
			return;
		this.body?.applyForceToCenter(
			new Vec2(this.moveForce * this.direction * (ticker.deltaMS / 1000), 0),
			true,
		);
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
}
