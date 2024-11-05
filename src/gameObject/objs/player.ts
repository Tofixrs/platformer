import { Box, Contact, Fixture, Vec2 } from "planck-js";
import { Sprite, Texture } from "pixi.js";
import { Entity } from "../types/entity";
import { World } from "world";
import { lerp2D } from "@lib/math/lerp";
import { Actions } from "@lib/input";
import { meter } from "@lib/math/units";
import { GOID } from "gameObject";

export class Player extends Entity {
	maxJumpVel = -20;
	moveForce = 1500;
	rollForce = 1000;
	longJumpVertForce = 1500;
	jumpForce = -40000;
	diveForce = 100000;
	maxDiveSpeed = 20;
	maxMoveSpeed = 15;
	maxRollSpeed = 25;
	maxLongJumpSpeed = 30;
	groundpoundSpeed = 25;
	jumping = false;
	sensor!: Fixture;
	onGround = false;
	crouching = false;
	rolling = false;
	pounding = false;
	lj = false;
	diving = false;
	direction = 1;
	divingDelayCounter = 0;
	divingDelay = 0.5; // in ms
	lockedMovement = false;
	static maxInstances = 1;
	constructor(pos: Vec2) {
		super({
			pos,
			friction: 0.2,
			density: 2,
			shape: new Box(0.23, 0.5),
			sprite: Sprite.from("player_normal"),
			bodyType: "dynamic",
			fixedRotation: true,
			goid: GOID.Player,
		});
		this.sprite.y -= 0.5 * meter;
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
	update(dt: number, world: World): void {
		super.update(dt, world);
		this.followCam(world, dt);
		this.handleMove(dt);
	}
	followCam(world: World, dt: number) {
		const pos = lerp2D(
			new Vec2(world.main.pivot.x, world.main.pivot.y),
			new Vec2(this.sprite.x, this.sprite.y),
			20 * dt,
		);
		world.main.pivot.set(pos.x, pos.y);
	}
	handleMove(dt: number) {
		if (Actions.hold("left")) {
			this.direction = -1;
		}

		if (Actions.hold("right")) {
			this.direction = 1;
		}
		this.sprite.scale.x = this.direction;
		this.handleJump(dt);
		this.handleCrouch();
		this.handleRoll(dt);
		this.handleGroundpound();
		this.handleWalk(dt);
		this.handleLongJump(dt);
		this.handleDive(dt);
	}
	handleJump(dt: number) {
		if (this.lockedMovement) return;
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
			new Vec2(0, this.jumpForce * dt),
			new Vec2(0, -1),
			true,
		);
	}

	handleCrouch() {
		if (this.pounding || this.diving || this.lockedMovement) return;

		const shouldCrouch = Actions.hold("crouch");
		if (!this.crouching && shouldCrouch) {
			this.setCrouch(true);
		} else if (this.crouching && !shouldCrouch) {
			this.setCrouch(false);
		}
	}

	handleRoll(dt: number) {
		if (this.lockedMovement || this.pounding || this.diving || this.lj) return;
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

		this.body?.applyForceToCenter(new Vec2(0, 25 * dt), true);
		this.body?.applyForce(
			new Vec2(this.direction * this.rollForce * dt, 0),
			new Vec2(0, -10),
			true,
		);
	}

	handleGroundpound() {
		if (this.rolling || this.lockedMovement || this.diving) return;

		if (Actions.click("groundpound") && !this.onGround) {
			this.pounding = true;
			this.sprite.texture = Texture.from("player_crouch");

			this.sprite.anchor.set(0.5, 0);
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

		this.body?.setLinearVelocity(new Vec2(0, this.groundpoundSpeed));
		this.body?.setGravityScale(0);
	}
	handleWalk(dt: number) {
		if (
			this.rolling ||
			this.diving ||
			this.pounding ||
			this.lockedMovement ||
			this.lj
		)
			return;

		if (!Actions.hold("left") && !Actions.hold("right")) return;
		if (this.body!.getLinearVelocity().x * this.direction > this.maxMoveSpeed)
			return;
		this.body?.applyForceToCenter(
			new Vec2(this.moveForce * this.direction * dt, 0),
			true,
		);
	}
	handleLongJump(dt: number) {
		if (this.rolling || this.pounding || this.lockedMovement || this.diving)
			return;
		const shouldLJ = Actions.hold("longjump") && Actions.hold("crouch");
		if (!this.lj && shouldLJ) {
			this.setLJ(true);
		} else if (this.lj && !shouldLJ) {
			this.setLJ(false);
		}
		if (!this.lj || !this.onGround) return;

		const vel = this.body.getLinearVelocity();
		vel.x += vel.x * (25 * dt);
		vel.x = Math.min(vel.x, this.maxLongJumpSpeed);
		vel.x = Math.max(vel.x, -this.maxLongJumpSpeed);
		vel.y -= this.longJumpVertForce * dt;
		this.body.setLinearVelocity(vel);
	}
	handleDive(dt: number) {
		if (this.pounding || this.rolling || this.lj) return;
		const shouldDive =
			Actions.hold("dive") && !this.onGround && this.divingDelayCounter == 0;
		if (!this.diving && shouldDive) {
			this.setDive(true);
			this.body.applyForceToCenter(
				new Vec2(this.diveForce * this.direction * dt, 0),
			);
		} else if (this.onGround && this.diving) {
			this.divingDelayCounter += dt;
			this.lockedMovement = true;
		}
		if (this.diving) {
			const vel = this.body.getLinearVelocity();
			vel.x = Math.min(vel.x, this.maxDiveSpeed);
			vel.x = Math.max(vel.x, -this.maxDiveSpeed);
			this.body.setLinearVelocity(vel);
		}
		if (this.divingDelayCounter >= this.divingDelay) {
			this.divingDelayCounter = 0;
			this.lockedMovement = false;
			this.setDive(false);
		} else if (this.divingDelayCounter > 0) {
			this.divingDelayCounter += dt;
		}
	}

	setCrouch(yes: boolean) {
		this.crouching = yes;
		this.setCrouchHitbox(true);
		this.sprite.texture = yes
			? Texture.from("player_crouch")
			: Texture.from("player_normal");
		this.sprite.anchor.set(0.5, yes ? 0 : 0.5);
	}
	setLJ(yes: boolean) {
		if (this.crouching) {
			this.sprite.texture = yes
				? Texture.from("player_lj")
				: Texture.from("player_crouch");
			this.sprite.anchor.set(yes ? 0.375 : 0.5, yes ? 0.5 : 0);
		} else {
			this.sprite.texture = yes
				? Texture.from("player_lj")
				: Texture.from("player_normal");
			this.sprite.anchor.set(yes ? 0.375 : 0.5, 0.5);
		}
		this.lj = yes;
	}
	setDive(yes: boolean) {
		this.body.setAngle(yes ? (Math.PI / 2) * this.direction : 0);
		this.diving = yes;
		const shape = this.sensor.m_shape as Box;

		//gotta love modifing verts of hitboxes lmao
		if (yes) {
			shape.m_vertices[0].x = 0.35 * this.direction;
			shape.m_vertices[0].y = -0.4;
			shape.m_vertices[1].x = 0.35 * this.direction;
			shape.m_vertices[1].y = 0.4;
			shape.m_vertices[2].x = 0.2 * this.direction;
			shape.m_vertices[2].y = 0.4;
			shape.m_vertices[3].x = 0.2 * this.direction;
			shape.m_vertices[3].y = -0.4;
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
