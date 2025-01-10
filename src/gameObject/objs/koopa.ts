import { capsule } from "@lib/shape";
import { Timer } from "@lib/ticker";
import { GameObject, GOID, Property, PropertyValue } from "gameObject";
import { Enemy } from "gameObject/types/enemy";
import { PhysObjUserData } from "gameObject/types/physicsObject";
import { Sprite, Texture } from "pixi.js";
import { Box, Contact, Fixture, Shape, Vec2 } from "planck";
import { World } from "world";
import { Player } from "./player";
import { getClassFromID } from "gameObject/utils";
import { Block } from "gameObject/types/block";

export class Koopa extends Enemy {
	rightEdgeSensor!: Fixture;
	leftEdgeSensor!: Fixture;
	touchedGroundsLeft: string[] = ["hack", "hack"];
	touchedGroundsRight: string[] = ["hack", "hack"];
	speed = 4;
	nornmalSpeed = 4;
	shellSpeed = 11;
	shelled = false;
	sideKillTimer = new Timer(0.2);
	stompPushTimer = new Timer(0.2);
	brickID?: string;
	kickSound = new Howl({
		src: ["./sounds/kick.wav"],
		volume: 1,
	});
	static props: Property[] = [
		{
			type: "number",
			name: "direction",
			defaultValue: "-1",
			descriptionKey: "directionDesc",
		},
		{
			type: "boolean",
			name: "shelled",
			defaultValue: "true",
			descriptionKey: "shelledDesc"
		}
	];
	constructor(pos: Vec2, direction?: number, shelled = false) {
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
		this.setShelled(shelled);
		
	}
	static commonConstructor(
		pos: Vec2,
		_shape: Shape,
		_startPos: Vec2,
		_currPos: Vec2,
		props?: PropertyValue[],
	): GameObject {
		const direction = props?.find((v) => v.name == "direction");
		const shelled = props?.find((v) => v.name == "shelled");
		return new Koopa(pos, Number(direction?.value), shelled?.value == "true" || shelled?.value == "1");
	}
	update(dt: number, world: World): void {
		super.update(dt, world);
		this.kickSound.pos(this.pos.x, this.pos.y);
		this.sideKillTimer.tick(dt);
		this.stompPushTimer.tick(dt);

		if (this.brickID) {
			world.removeEntity(this.brickID);
			this.brickID = undefined;
		}
	}
	onStomp(
		_enemyUser: PhysObjUserData,
		playerUser: PhysObjUserData,
		_enemyFix: Fixture,
		_playerFix: Fixture,
		world: World,
	): void {
		if (this.shelled && this.stompPushTimer.done()) {
			this.moving = !this.moving;
			this.kickSound.play();
			this.stompPushTimer.reset();
			this.reCheckSideTouch(world);
		}
		if (!this.shelled && this.stompPushTimer.done()) {
			this.stompSound.play();
			this.setShelled(true);
			this.stompPushTimer.reset();
		}
		const player = world.entities.find((v) => v.id == playerUser.id) as Player;
		player.body.applyForceToCenter(new Vec2(0, -500), true);
	}
	setShelled(yes: boolean) {
		this.moving = !yes;
		this.shelled = yes;
		if (!yes) {
			this.body?.setLinearVelocity(new Vec2(0, 0));
		}
		this.sprite.texture = yes
			? Texture.from("koopa_shelled")
			: Texture.from("koopa");
		this.sprite.anchor.set(yes ? 0.5 : 0.35, yes ? 0.5 : 0.75);
		this.speed = this.shelled ? this.shellSpeed : this.nornmalSpeed;
	}
	reCheckSideTouch(world: World) {
		for (let contact = this.body.getContactList(); contact; contact = contact.next) {
			const c = contact.contact;
			const fixA = c.getFixtureA();
			const fixB = c.getFixtureB();
			if (fixA != this.leftWallSensor && fixB != this.leftWallSensor && fixA != this.rightWallSensor && fixB != this.rightWallSensor) continue;

			if (!c.isTouching()) continue;
			const sensorFix = fixA == this.leftWallSensor || fixA == this.rightWallSensor ? fixA : fixB;
			const otherFix = fixA == this.leftWallSensor || fixA == this.rightWallSensor ? fixB : fixA;
			this.direction = sensorFix == this.leftWallSensor ? 1 : -1;
			this.body.setLinearVelocity(new Vec2(this.speed * this.direction, 0));

			const otherUser = otherFix.getUserData() as PhysObjUserData
			if (otherUser?.goid == GOID.Brick || otherUser?.goid == GOID.Player) {
				world.p.queueUpdate(() => {
					world.removeEntity(otherUser.id);
				})
			}
			
		} 
	}
	create(world: World): void {
		super.create(world);
		this.rightEdgeSensor = this.body.createFixture({
			shape: new Box(0.08, 0.1, new Vec2(0.18, 0.25)),
			isSensor: true,
			filterMaskBits: 0b1,
		});

		this.leftEdgeSensor = this.body.createFixture({
			shape: new Box(0.08, 0.1, new Vec2(-0.18, 0.25)),
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
		if (this.shelled) return;
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
	onSideTouch(
		userData: PhysObjUserData,
		sensorFix: Fixture,
		_otherFix: Fixture,
		world: World,
	): void {
		if (userData.goid == GOID.Player) {
			if (this.shelled) {
				if (this.moving) {
					world.removeEntity(userData.id);
				} else {
					this.moving = true;
					this.kickSound.play();
					this.sideKillTimer.reset();
					this.direction = sensorFix == this.leftWallSensor ? 1 : -1;
				}
			} else {
				world.removeEntity(userData.id);
			}
		} else {
			const objClass = getClassFromID(userData.goid);
			if (
				this.shelled &&
				this.moving &&
				(objClass.prototype instanceof Block ||
					objClass.prototype instanceof Enemy)
			) {
				world.removeEntity(userData.id, false, true);
				if (objClass.prototype instanceof Block) {
					this.direction = -this.direction;
				}
			} else {
				this.direction = sensorFix == this.leftWallSensor ? 1 : -1;
				this.body.setLinearVelocity(new Vec2(this.speed * this.direction, 0));
			}
		}
	}
}
