import { GOID } from "gameObject";
import { Enemy } from "gameObject/types/enemy";
import { AnimatedSprite, Texture } from "pixi.js";
import { Box, Contact, Fixture, Vec2 } from "planck-js";
import { World } from "world";

export class Goomba extends Enemy {
	rightEdgeSensor!: Fixture;
	leftEdgeSensor!: Fixture;
	rightWallSensor!: Fixture;
	leftWallSensor!: Fixture;
	speed = 4;
	constructor(pos: Vec2, direction?: number) {
		const anim = new AnimatedSprite([
			Texture.from("goomba_1"),
			Texture.from("goomba_2"),
		]);
		anim.animationSpeed = 0.05;
		anim.play();
		super({
			pos,
			shape: new Box(0.25, 0.25),
			sprite: anim,
			density: 0.5,
			friction: 1,
			goid: GOID.Goomba,
			direction,
		});
		this.sprite.anchor.set(0.5, 0.5);
	}
	update(dt: number, world: World): void {
		super.update(dt, world);
		this.body.setLinearVelocity(
			new Vec2(this.speed * this.direction, this.body.getLinearVelocity().y),
		);
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
			shape: new Box(0.1, 0.1, new Vec2(0.3, 0)),
			isSensor: true,
			filterMaskBits: 10,
		});

		this.leftWallSensor = this.body.createFixture({
			shape: new Box(0.1, 0.1, new Vec2(-0.3, 0)),
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

		this.direction = -this.direction;
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
	}

	onSideTouch(world: World): void {
		switch (this.sideTouchGOID) {
			case GOID.Player: {
				world.removeEntity(this.sideTouchID!);
			}
			case GOID.Koopa:
			case GOID.Goomba: {
				this.direction = 1;
				break;
			}
		}
	}
}
