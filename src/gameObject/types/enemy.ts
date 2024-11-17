import { Fixture, Shape, Vec2, WorldManifold } from "planck-js";
import { Entity } from "./entity";
import { GameObject, GameObjectID } from "gameObject";
import { Sprite } from "pixi.js";
import { World } from "world";
import { PhysObjUserData } from "./physicsObject";
import { getClassFromID } from "gameObject/utils";
import { Player } from "@gameObjs/player";
import { Ground } from "./ground";

export interface EnemyOptions {
	sprite: Sprite;
	pos: Vec2;
	direction?: number;
	shape: Shape;
	goid: GameObjectID;
	density: number;
	friction: number;
}

export class Enemy extends Entity {
	direction = -1;
	stomp = false;
	stompID?: string;
	sideTouch = false;
	sideTouchID?: string;
	sideTouchGOID?: GameObjectID;
	sideTouched?: number;
	constructor({
		pos,
		friction,
		density,
		direction,
		sprite,
		shape,
		goid,
	}: EnemyOptions) {
		super({
			pos,
			friction,
			density,
			shape,
			sprite,
			goid,
			bodyType: "dynamic",
			fixedRotation: true,
		});
		this.direction = direction || this.direction;
	}
	update(dt: number, world: World): void {
		super.update(dt, world);
		if (this.stomp) {
			this.onStomp(world);
			this.stomp = false;
			this.stompID = undefined;
		}

		if (this.sideTouch) {
			this.onSideTouch(world);
			this.sideTouch = false;
			this.sideTouchID = undefined;
			this.sideTouched = undefined;
		}
	}
	create(world: World): void {
		super.create(world);

		world.p.on("pre-solve", (contact) => {
			const fixA = contact.getFixtureA();
			const fixB = contact.getFixtureB();
			const userA = fixA.getUserData() as PhysObjUserData;
			const userB = fixB.getUserData() as PhysObjUserData;
			const worldManifold = contact.getWorldManifold(undefined)!;

			if (userA == null || userB == null) return;

			const classA = getClassFromID(userA.goid);
			const classB = getClassFromID(userB.goid);

			if (userA.id != this.id && userB.id != this.id) return;

			this.checkStomp(fixA, fixB, userA, userB, classA, classB);
			this.checkSideTouch(
				fixA,
				fixB,
				userA,
				userB,
				classA,
				classB,
				worldManifold,
			);
		});
	}
	checkStomp(
		fixA: Fixture,
		fixB: Fixture,
		userA: PhysObjUserData,
		userB: PhysObjUserData,
		classA: typeof GameObject,
		classB: typeof GameObject,
	) {
		if (
			//@ts-expect-error
			classA != Player &&
			//@ts-expect-error
			classB != Player
		)
			return;
		if (
			!(classA.prototype instanceof Enemy) &&
			!(classB.prototype instanceof Enemy)
		)
			return;

		const fix = classA == Player ? fixA : fixB;
		this.stomp = fix.getBody().m_linearVelocity.y > 0;
		if (this.stomp) {
			this.stompID = classA == Player ? userA.id : userB.id;
			fix.getBody().applyForceToCenter(new Vec2(0, -1000), true);
			return;
		}
	}
	checkSideTouch(
		fixA: Fixture,
		fixB: Fixture,
		userA: PhysObjUserData,
		userB: PhysObjUserData,
		classA: typeof GameObject,
		classB: typeof GameObject,
		worldManifold: WorldManifold,
	) {
		if (this.stomp) return;
		if (
			!(classA.prototype instanceof Enemy) &&
			!(classB.prototype instanceof Enemy)
		)
			return;
		if (classA.prototype instanceof Ground) return;
		if (classB.prototype instanceof Ground) return;

		this.sideTouch = worldManifold?.normal.x != 0;
		const fix = this.id != userA.id ? fixA : fixB;
		if (this.sideTouch) {
			this.sideTouchID = this.id != userA.id ? userA.id : userB.id;
			this.sideTouchGOID = this.id != userA.id ? userA.goid : userB.goid;
			this.sideTouched = fix.getBody().getLinearVelocity().x < 0 ? -1 : 1;
		}
	}
	onSideTouch(world: World) {
		world.removeEntity(this.sideTouchID!);
	}
	onStomp(world: World): void {
		world.removeEntity(this.id);
	}
}
