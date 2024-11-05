import { GOID } from "gameObject";
import { Entity } from "gameObject/types/entity";
import { PhysicsObject, PhysObjUserData } from "gameObject/types/physicsObject";
import { AnimatedSprite, Texture } from "pixi.js";
import { Box, Contact, Fixture, Polygon, Vec2 } from "planck-js";
import { World } from "world";

export class Koopa extends Entity {
	rightEdgeSensor!: Fixture;
	leftEdgeSensor!: Fixture;
	stompSensor!: Fixture;
	directon = 1;
	killId?: string;
	shell = false;
	movingShell = false;
	shelledSpeed = 7.5;
	walkSpeed = 1;
	die = false;
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
			goid: GOID.Koopa,
		});
		this.sprite.anchor.set(0.5, 0.5);
		this.directon = directon || this.directon;
	}
	update(dt: number, world: World): void {
		super.update(dt, world);
		this.body.setLinearVelocity(
			new Vec2(
				(this.shell ? this.shelledSpeed : this.walkSpeed) * this.directon,
				this.body.getLinearVelocity().y,
			),
		);
		this.checkKill(world);
		this.checkDeath(world);
	}
	checkKill(world: World) {
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
	checkDeath(world: World) {
		if (!this.die) return;
		const i = world.entities.findIndex((v) => {
			if (!(v instanceof PhysicsObject)) return false;
			for (let fix = v.body.m_fixtureList; fix; fix = fix!.m_next) {
				const userData = fix.getUserData() as PhysObjUserData;
				if (userData == null) continue;
				if (userData.id != this.id) continue;
				return userData.id == this.id;
			}
		});
		if (this.shell) {
			world.removeEntity(this, i);
		} else {
			this.shelled = true;
			this.die = false;
		}
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

		this.stompSensor = this.body.createFixture({
			shape: new Box(0.25, 0.1, new Vec2(0, -0.3)),
			isSensor: true,
		});

		world.p.on("end-contact", (contact) => {
			this.endContact(contact);
		});
		world.p.on("begin-contact", (contact) => {
			this.beginContact(contact);
		});
	}
	endContact(contact: Contact) {
		const fixA = contact.getFixtureA();
		const fixB = contact.getFixtureB();

		this.checkEdgeSensors(fixA, fixB, contact);
	}
	beginContact(contact: Contact) {
		const fixA = contact.getFixtureA();
		const fixB = contact.getFixtureB();

		this.checkEdgeSensors(fixA, fixB, contact);
		// this.checkIfPlayer(fixA, fixB);
		this.checkStomp(fixA, fixB);
	}
	checkIfPlayer(fixA: Fixture, fixB: Fixture) {
		const userDataA = fixA.getUserData() as PhysObjUserData;
		const userDataB = fixB.getUserData() as PhysObjUserData;
		if (userDataA == null) return;
		if (userDataB == null) return;
		if (!("id" in userDataA)) return;
		if (!("id" in userDataB)) return;
		if (userDataB.goid != this.goid && userDataA.goid != this.goid) return;
		if (userDataA.goid == GOID.Player) {
			this.killId = userDataA.id;
		} else if (userDataB.goid == GOID.Player) {
			this.killId = userDataB.id;
		}
	}
	checkStomp(fixA: Fixture, fixB: Fixture) {
		const userDataA = fixA.getUserData() as PhysObjUserData;
		const userDataB = fixB.getUserData() as PhysObjUserData;
		if (userDataA == null) return;
		if (userDataB == null) return;
		if (!("id" in userDataA)) return;
		if (!("id" in userDataB)) return;
		if (userDataB.goid != this.goid && userDataA.goid != this.goid) return;
		if (userDataA.goid != GOID.Player && userDataB.goid != GOID.Player) return;

		this.die = true;
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
		if (contact.isTouching()) return;

		this.directon = -this.directon;
	}
	set shelled(shell: boolean) {
		if (shell == this.shell) return;
		this.shell = shell;
		const leftPoly = this.leftEdgeSensor.m_shape as Polygon;
		const rightPoly = this.rightEdgeSensor.m_shape as Polygon;

		const amt = shell ? -0.25 : 0.25;
		for (const vert of leftPoly.m_vertices) {
			vert.y += amt;
		}
		for (const vert of rightPoly.m_vertices) {
			vert.y += amt;
		}
	}
}
