import { GameObjectID, GOID } from "gameObject";
import { Entity } from "gameObject/types/entity";
import { PhysicsObject, PhysObjUserData } from "gameObject/types/physicsObject";
import { AnimatedSprite, Texture } from "pixi.js";
import { Box, Contact, Fixture, Vec2, Body } from "planck-js";
import { World } from "world";

export class Goomba extends Entity {
	rightEdgeSensor!: Fixture;
	leftEdgeSensor!: Fixture;
	directon = 1;
	killId?: string;
	constructor(pos: Vec2, directon?: number) {
		const anim = new AnimatedSprite([
			Texture.from("goomba_1"),
			Texture.from("goomba_2"),
		]);
		anim.animationSpeed = 0.075;
		anim.play();
		super({
			pos,
			shape: new Box(0.25, 0.25),
			sprite: anim,
			density: 0.5,
			fixedRotation: true,
			bodyType: "dynamic",
			friction: 1,
			id: GOID.Goomba,
		});
		this.sprite.anchor.set(0.5, 0.5);
		this.directon = directon || this.directon;
	}
	update(dt: number, world: World): void {
		super.update(dt, world);
		this.body.setLinearVelocity(
			new Vec2(500 * dt * this.directon, this.body.getLinearVelocity().y),
		);
		if (!this.killId) return;
		world.entities.forEach((v, i) => {
			if (!(v instanceof PhysicsObject)) return;
			for (let fix = v.body.m_fixtureList; fix; fix = fix!.m_next) {
				const userData = fix.getUserData() as PhysObjUserData;
				if (userData == null) continue;
				if (userData.id != this.killId) continue;

				world.removeEntity(v, i);
				this.killId = undefined;
				break;
			}
		});
	}
	create(world: World): void {
		super.create(world);
		this.rightEdgeSensor = this.body.createFixture({
			shape: new Box(0.1, 0.1, new Vec2(0.35, 0.25)),
			isSensor: true,
			filterMaskBits: 10,
		});

		this.leftEdgeSensor = this.body.createFixture({
			shape: new Box(0.1, 0.1, new Vec2(-0.35, 0.25)),
			isSensor: true,
			filterMaskBits: 10,
		});

		world.p.on("begin-contact", (contact) => {
			this.checkContact(contact);
		});

		world.p.on("end-contact", (contact) => {
			this.checkContact(contact);
		});
	}
	checkContact(contact: Contact) {
		const fixA = contact.getFixtureA();
		const fixB = contact.getFixtureB();
		this.checkSensors(fixA, fixB, contact);
		this.checkIfPlayer(fixA, fixB);
	}
	checkIfPlayer(fixA: Fixture, fixB: Fixture) {
		const userDataA = fixA.getUserData() as PhysObjUserData;
		const userDataB = fixB.getUserData() as PhysObjUserData;
		if (userDataA == null) return;
		if (userDataB == null) return;
		if (!("id" in userDataA)) return;
		if (!("id" in userDataB)) return;
		if (userDataB.goid != GOID.Goomba && userDataA.goid != GOID.Goomba) return;
		if (userDataA.goid == GOID.Player) {
			this.killId = userDataA.id;
		} else if (userDataB.goid == GOID.Player) {
			this.killId = userDataB.id;
		}
	}
	checkSensors(fixA: Fixture, fixB: Fixture, contact: Contact) {
		if (
			fixA != this.leftEdgeSensor &&
			fixB != this.leftEdgeSensor &&
			fixA != this.rightEdgeSensor &&
			fixB != this.rightEdgeSensor
		)
			return;
		if (contact.isTouching()) return;

		this.directon = -this.directon;
	}
}
