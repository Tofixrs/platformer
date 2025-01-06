import { capsule } from "@lib/shape";
import { GameObject, GOID, PropertyValue } from "gameObject";
import { Enemy } from "gameObject/types/enemy";
import { PhysObjUserData } from "gameObject/types/physicsObject";
import { AnimatedSprite, Texture } from "pixi.js";
import { Box, Contact, Fixture, Shape, Vec2 } from "planck";
import { World } from "world";

export class Goomba extends Enemy {
	rightEdgeSensor!: Fixture;
	leftEdgeSensor!: Fixture;
	touchedGroundsLeft: string[] = ["hack", "hack"];
	touchedGroundsRight: string[] = ["hack", "hack"];
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
			shape: capsule(new Vec2(0.23, 0.23)),
			sprite: anim,
			density: 0.5,
			friction: 1,
			goid: GOID.Goomba,
			direction,
		});
		this.sprite.anchor.set(0.5, 0.5);
	}
	static commonConstructor(
		pos: Vec2,
		_shape: Shape,
		_startPos: Vec2,
		_currPos: Vec2,
		props?: PropertyValue[],
	): GameObject {
		const direction = props?.find((v) => v.name == "direction");
		return new Goomba(pos, Number(direction?.value));
	}
	update(dt: number, world: World): void {
		super.update(dt, world);
		this.body.setLinearVelocity(
			new Vec2(this.speed * this.direction, this.body.getLinearVelocity().y),
		);

		let touching = false;
		for (let cList = this.body.getContactList(); cList; cList = cList!.next!) {
			if (cList.contact.isTouching()) {
				touching = true;
				break;
			}
		}
		if (!touching) {
			this.touchedGroundsRight = ["hack", "hack"];
			this.touchedGroundsLeft = ["hack", "hack"];
		}
	}
	create(world: World): void {
		super.create(world);
		this.rightEdgeSensor = this.body.createFixture({
			shape: new Box(0.07, 0.1, new Vec2(0.18, 0.25)),
			isSensor: true,
			filterMaskBits: 0b1,
		});

		this.leftEdgeSensor = this.body.createFixture({
			shape: new Box(0.07, 0.1, new Vec2(-0.18, 0.25)),
			isSensor: true,
			filterMaskBits: 0b1,
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
		this.checkEdgeSensors(fixA, fixB, contact);
	}
	checkEdgeSensors(fixA: Fixture, fixB: Fixture, contact: Contact) {
		if (
			fixA != this.leftEdgeSensor &&
			fixB != this.leftEdgeSensor &&
			fixA != this.rightEdgeSensor &&
			fixB != this.rightEdgeSensor
		)
			return;
		if (fixA.isSensor() && fixB.isSensor()) return;
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
		} else if (leftL == 0 && rightL > 0) {
			this.direction = 1;
		}
		this.touchedGroundsRight = this.touchedGroundsRight.filter(
			(v) => v != "hack",
		);
		this.touchedGroundsLeft = this.touchedGroundsLeft.filter(
			(v) => v != "hack",
		);
	}
}
