import { Box, Fixture, Shape, Vec2, WorldManifold } from "planck";
import { Entity } from "./entity";
import { GameObject, GameObjectID, Property, PropType } from "gameObject";
import { Sprite } from "pixi.js";
import { World } from "world";
import { PhysObjUserData } from "./physicsObject";
import { getClassFromID } from "gameObject/utils";
import { Player } from "@gameObjs/player";
import { Ground } from "./ground";
import { SerializedGO } from "@lib/serialize";

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
	sideTouchGO?: GameObject;
	stompSound = new Howl({
		src: ["./sounds/stomp.wav"],
		volume: 1,
	});
	static props: Property[] = [
		{
			type: "number",
			name: "direction",
			defaultValue: "-1",
			descriptionKey: "directionDesc",
		},
	];
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
			const ent = world.entities.find((v) => v.id == this.sideTouchID);
			this.sideTouchGO = ent;
			if (this.sideTouchGO instanceof Enemy) {
				this.sideTouchGO.sideTouch = true;
				this.sideTouchGO.sideTouchID = this.id;
				this.sideTouchGO.sideTouched = -this.sideTouched!;
				this.sideTouchGO.sideTouchGO = this;
				this.sideTouchGO.onSideTouchOtherEnemy(world);
				this.onSideTouchOtherEnemy(world);
				this.sideTouchGO.sideTouch = false;
				this.sideTouchGO.sideTouchID = undefined;
				this.sideTouchGO.sideTouched = undefined;
				this.sideTouchGO.sideTouchGO = undefined;
				this.sideTouch = false;
				this.sideTouchID = undefined;
				this.sideTouched = undefined;
				this.sideTouchGO = undefined;
				return;
			}
			this.onSideTouch(world);
			this.sideTouch = false;
			this.sideTouchID = undefined;
			this.sideTouched = undefined;
			this.sideTouchGO = undefined;
		}
		this.stompSound.pos(this.pos.x, this.pos.y);
	}
	create(world: World): void {
		super.create(world);

		world.p.on("pre-solve", (contact) => {
			const fixA = contact.getFixtureA();
			const fixB = contact.getFixtureB();
			const userA = fixA.getUserData() as PhysObjUserData;
			const userB = fixB.getUserData() as PhysObjUserData;
			const worldManifold = contact.getWorldManifold(null)!;

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
		this.stomp = fix.getBody().getLinearVelocity().y > 0;
		if (this.stomp) {
			this.stompID = classA == Player ? userA.id : userB.id;
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
		if (!this.sideTouch) return;

		this.sideTouchID = this.id != userA.id ? userA.id : userB.id;
		this.sideTouchGOID = this.id != userA.id ? userA.goid : userB.goid;
		this.sideTouched = fix.getBody().getLinearVelocity().x < 0 ? -1 : 1;
	}
	onSideTouch(world: World) {
		world.removeEntity(this.sideTouchID!);
	}
	onSideTouchOtherEnemy(_world: World) {
		const pos = this.body.getPosition();
		this.direction = this.sideTouched!;
		pos.x += 0.05 * this.direction;
	}
	onStomp(world: World): void {
		world.removeEntity(this.id);
	}
	serialize(): SerializedGO {
		return {
			_type: this.goid,
			data: {
				pos: this.pos,
				direction: this.direction,
			},
		};
	}
	remove(world: World, force?: boolean): boolean {
		if (!force) this.stompSound.play();
		return super.remove(world, force);
	}
	static deserialize(obj: SerializedGO): GameObject {
		const c = getClassFromID(obj._type);
		return c.commonConstructor(
			new Vec2(obj.data.pos.x, obj.data.pos.y),
			new Box(0, 0),
			Vec2.zero(),
			Vec2.zero(),
			[
				{
					name: "direction",
					value: String(obj.data.direction),
					type: PropType.number,
				},
			],
		);
	}
}
