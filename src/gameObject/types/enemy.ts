import { Shape, Vec2 } from "planck-js";
import { Entity } from "./entity";
import { GameObjectID } from "gameObject";
import { Sprite } from "pixi.js";
import { World } from "world";
import { PhysObjUserData } from "./physicsObject";
import { getClassFromID } from "gameObject/utils";
import { Player } from "@gameObjs/player";

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
	direction = 1;
	stomp = false;
	stompID?: string;
	sideTouch = false;
	sideTouchID?: string;
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
			if (userA == null || userB == null) return;
			if (userA.id != this.id && userB.id != this.id) return;
			const classA = getClassFromID(userA.goid);
			const classB = getClassFromID(userB.goid);
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

			const worldManifold = contact.getWorldManifold(undefined);
			this.stomp = worldManifold?.normal.y != 0;
			if (this.stomp) {
				this.stompID = classA == Player ? userA.id : userB.id;
				const fix = classA == Player ? fixA : fixB;
				fix.getBody().applyForceToCenter(new Vec2(0, -1000), true);
				return;
			}
			this.sideTouch = worldManifold?.normal.x != 0;
			if (this.sideTouch) {
				this.sideTouchID = classA == Player ? userA.id : userB.id;
				this.sideTouched = -worldManifold!.normal.x;
			}
		});
	}
	onSideTouch(world: World) {
		world.removeEntity(this.sideTouchID!);
	}
	onStomp(world: World): void {
		world.removeEntity(this.id);
	}
}
