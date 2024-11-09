import { Timer } from "@lib/ticker";
import { GOID } from "gameObject";
import { Enemy } from "gameObject/types/enemy";
import { Sprite, Texture } from "pixi.js";
import { Box, Contact, Fixture, Vec2 } from "planck-js";
import { World } from "world";

export class Koopa extends Enemy {
	rightEdgeSensor!: Fixture;
	leftEdgeSensor!: Fixture;
	rightWallSensor!: Fixture;
	leftWallSensor!: Fixture;
	speed = 4;
	shellSpeed = 10;
	shelled = false;
	moving = true;
	sideKillTimer = new Timer(0.2);
	stompPushTimer = new Timer(0.2);
	constructor(pos: Vec2, direction?: number) {
		super({
			pos,
			shape: new Box(0.25, 0.25),
			sprite: Sprite.from("koopa"),
			density: 0.5,
			friction: 1,
			goid: GOID.Koopa,
			direction,
		});
		this.sprite.anchor.set(0.35, 0.7);
	}
	update(dt: number, world: World): void {
		super.update(dt, world);
		this.sideKillTimer.tick(dt);
		this.stompPushTimer.tick(dt);
		if (!this.moving) return;
		this.body.setLinearVelocity(
			new Vec2(
				(this.shelled ? this.shellSpeed : this.speed) * this.direction,
				this.body.getLinearVelocity().y,
			),
		);
	}
	onStomp(world: World): void {
		if (this.shelled && this.stompPushTimer.done()) {
			this.moving = !this.moving;
			this.stompPushTimer.reset();
		}
		if (!this.shelled && this.stompPushTimer.done()) {
			this.setShelled(true);
			this.stompPushTimer.reset();
		}
	}
	onSideTouch(world: World): void {
		switch (this.sideTouchGOID) {
			case GOID.Player: {
				if (this.shelled && !this.moving) {
					this.moving = true;
					this.sideKillTimer.reset();
					this.direction = this.sideTouched!;
				} else if (this.shelled && this.moving && this.sideKillTimer.done()) {
					world.removeEntity(this.sideTouchID!);
				} else if (!this.shelled) {
					world.removeEntity(this.sideTouchID!);
				}
				break;
			}
			case GOID.Koopa:
			case GOID.Goomba: {
				if (this.shelled && this.moving) {
					world.removeEntity(this.sideTouchID!);
				} else {
					this.direction = 1;
				}
				break;
			}
		}
	}
	setShelled(yes: boolean) {
		this.moving = !yes;
		this.shelled = yes;
		if (!yes) {
			this.body.setLinearVelocity(new Vec2(0, 0));
		}
		this.sprite.texture = yes
			? Texture.from("koopa_shelled")
			: Texture.from("koopa");
		this.sprite.anchor.set(yes ? 0.5 : 0.35, yes ? 0.5 : 0.7);
	}
	create(world: World): void {
		super.create(world);
		this.rightEdgeSensor = this.body.createFixture({
			shape: new Box(0.07, 0.1, new Vec2(0.18, 0.25)),
			isSensor: true,
			filterMaskBits: 10,
		});

		this.leftEdgeSensor = this.body.createFixture({
			shape: new Box(0.07, 0.1, new Vec2(-0.18, 0.25)),
			isSensor: true,
			filterMaskBits: 10,
		});

		this.rightWallSensor = this.body.createFixture({
			shape: new Box(0.1, 0.1, new Vec2(0.25, 0)),
			isSensor: true,
			filterMaskBits: 10,
		});

		this.leftWallSensor = this.body.createFixture({
			shape: new Box(0.1, 0.1, new Vec2(-0.25, 0)),
			isSensor: true,
			filterMaskBits: 10,
		});

		world.p.on("end-contact", (contact) => {
			this.onEnd(contact);
		});

		world.p.on("begin-contact", (contact) => {
			this.onBegin(contact);
		});
	}
	onEnd(contact: Contact) {
		const fixA = contact.getFixtureA();
		const fixB = contact.getFixtureB();
		this.checkEdgeSensors(fixA, fixB, contact);
	}
	onBegin(contact: Contact) {
		const fixA = contact.getFixtureA();
		const fixB = contact.getFixtureB();
		this.checkWallSensors(fixA, fixB, contact);
	}
	checkEdgeSensors(fixA: Fixture, fixB: Fixture, contact: Contact) {
		if (
			fixA != this.leftEdgeSensor &&
			fixB != this.leftEdgeSensor &&
			fixA != this.rightEdgeSensor &&
			fixB != this.rightEdgeSensor
		)
			return;
		if (contact.isTouching()) return;
		if (this.shelled) return;

		this.direction = -this.direction;
		this.sprite.scale.x = this.direction;
	}

	checkWallSensors(fixA: Fixture, fixB: Fixture, contact: Contact) {
		if (
			fixA != this.leftWallSensor &&
			fixB != this.leftWallSensor &&
			fixA != this.rightWallSensor &&
			fixB != this.rightWallSensor
		)
			return;
		if (!contact.isTouching()) return;

		this.direction = -this.direction;
		this.sprite.scale.x = this.direction;
	}
}
