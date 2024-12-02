import { capsule } from "@lib/shape";
import { Timer } from "@lib/ticker";
import { GameObject, GOID, Property, PropertyValue } from "gameObject";
import { Enemy } from "gameObject/types/enemy";
import { PhysObjUserData } from "gameObject/types/physicsObject";
import { Sprite, Texture } from "pixi.js";
import { Box, Contact, Fixture, Shape, Vec2 } from "planck-js";
import { World } from "world";
import { Player } from "./player";

export class Koopa extends Enemy {
	rightEdgeSensor!: Fixture;
	leftEdgeSensor!: Fixture;
	rightWallSensor!: Fixture;
	leftWallSensor!: Fixture;
	touchedGroundsLeft: string[] = ["hack", "hack"];
	touchedGroundsRight: string[] = ["hack", "hack"];
	speed = 4;
	shellSpeed = 10;
	shelled = false;
	moving = true;
	sideKillTimer = new Timer(0.2);
	stompPushTimer = new Timer(0.2);
	brickID?: string;
	static props: Property[] = [
		{
			type: "number",
			name: "direction",
			defaultValue: "-1",
		},
	];
	constructor(pos: Vec2, direction?: number) {
		super({
			pos,
			shape: capsule(new Vec2(0.23, 0.23)),
			sprite: Sprite.from("koopa"),
			density: 0.5,
			friction: 1,
			goid: GOID.Koopa,
			direction,
		});
		this.sprite.anchor.set(0.35, 0.75);
		this.sprite.scale.x = this.direction;
	}
	static commonConstructor(
		pos: Vec2,
		_shape: Shape,
		_startPos: Vec2,
		_currPos: Vec2,
		props?: PropertyValue[],
	): GameObject {
		const direction = props?.find((v) => v.name == "direction");
		return new Koopa(pos, Number(direction?.value));
	}
	update(dt: number, world: World): void {
		super.update(dt, world);
		this.sideKillTimer.tick(dt);
		this.stompPushTimer.tick(dt);

		if (this.brickID) {
			world.removeEntity(this.brickID);
			this.brickID = undefined;
		}

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
		const player = world.entities.find((v) => v.id == this.stompID) as Player;
		player.body.applyForceToCenter(new Vec2(0, -500), true);
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
		}
	}
	onSideTouchOtherEnemy(world: World): void {
		if (this.shelled && this.moving) {
			world.removeEntity(this.sideTouchID!);
			return;
		}

		this.direction = -this.direction;
		this.sprite.scale.x = this.direction;
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
			shape: new Box(0.08, 0.1, new Vec2(0.18, 0.25)),
			isSensor: true,
			filterMaskBits: 10,
		});

		this.leftEdgeSensor = this.body.createFixture({
			shape: new Box(0.08, 0.1, new Vec2(-0.18, 0.25)),
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
		this.checkEdgeSensors(fixA, fixB, contact);
	}
	checkEdgeSensors(fixA: Fixture, fixB: Fixture, contact: Contact) {
		if (this.shelled) return;
		if (
			fixA != this.leftEdgeSensor &&
			fixB != this.leftEdgeSensor &&
			fixA != this.rightEdgeSensor &&
			fixB != this.rightEdgeSensor
		)
			return;
		const userA = fixA.getUserData();
		const userB = fixB.getUserData();
		const groundUser = (
			fixA == this.leftEdgeSensor || fixA == this.rightEdgeSensor
				? userB
				: userA
		) as PhysObjUserData;
		if (contact.isTouching()) {
			if (fixA == this.leftEdgeSensor || fixB == this.leftEdgeSensor) {
				this.touchedGroundsLeft.push(groundUser.id);
			} else if (fixA == this.rightEdgeSensor || fixB == this.rightEdgeSensor) {
				this.touchedGroundsRight.push(groundUser.id);
			}
		} else {
			if (fixA == this.leftEdgeSensor || fixB == this.leftEdgeSensor) {
				this.touchedGroundsLeft = this.touchedGroundsLeft.filter(
					(v) => v != groundUser.id,
				);
			} else if (fixA == this.rightEdgeSensor || fixB == this.rightEdgeSensor) {
				this.touchedGroundsRight = this.touchedGroundsRight.filter(
					(v) => v != groundUser.id,
				);
			}
		}

		const leftL = this.touchedGroundsLeft.length;
		const rightL = this.touchedGroundsRight.length;

		if (leftL > 0 && rightL == 0) {
			this.direction = -1;
			this.sprite.scale.x = this.direction;
		} else if (leftL == 0 && rightL > 0) {
			this.direction = 1;
			this.sprite.scale.x = this.direction;
		}
		this.touchedGroundsRight = this.touchedGroundsRight.filter(
			(v) => v != "hack",
		);
		this.touchedGroundsLeft = this.touchedGroundsLeft.filter(
			(v) => v != "hack",
		);
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

		const userA = fixA.getUserData() as PhysObjUserData;
		const userB = fixB.getUserData() as PhysObjUserData;
		if ((userA || userB) && this.shelled && this.moving) {
			const other =
				fixA == this.leftWallSensor || fixA == this.rightEdgeSensor
					? userB
					: userA;

			if (other?.goid == GOID.Brick) {
				this.brickID = other.id;
				return;
			}
		}
		this.direction =
			fixA == this.leftWallSensor || fixB == this.leftWallSensor ? 1 : -1;
		this.body.setLinearVelocity(new Vec2(this.speed * this.direction, 0));
		this.sprite.scale.x = this.direction;
	}
}
