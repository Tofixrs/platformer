import { Box, Contact, Fixture, Shape, Vec2 } from "planck";
import { Entity } from "./entity";
import { GameObject, GameObjectID, GOID, Property, PropType } from "gameObject";
import { Sprite } from "pixi.js";
import { World } from "world";
import { PhysObjUserData } from "./physicsObject";
import { getClassFromID } from "gameObject/utils";
import { Player } from "@gameObjs/player";
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
	_direction = -1;
	rightWallSensor!: Fixture;
	leftWallSensor!: Fixture;
	stompSound = new Howl({
		src: ["./sounds/stomp.wav"],
		volume: 1,
	});
	speed = 0;
	moving = true;
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

		this.stompSound.pos(this.pos.x, this.pos.y);

		if (!this.moving) return;
		this.body.setLinearVelocity(
			new Vec2(this.speed * this.direction, this.body.getLinearVelocity().y),
		);
	}
	create(world: World): void {
		super.create(world);

		this.rightWallSensor = this.body.createFixture({
			shape: new Box(0.025, 0.1, new Vec2(0.3, 0)),
			isSensor: true,
			filterMaskBits: 0b11,
		});

		this.leftWallSensor = this.body.createFixture({
			shape: new Box(0.025, 0.1, new Vec2(-0.3, 0)),
			isSensor: true,
			filterMaskBits: 0b11,
		});

		world.p.on("begin-contact", (contact) => {
			const fixA = contact.getFixtureA();
			const fixB = contact.getFixtureB();
			this.checkSide(fixA, fixB, contact, world);
		});

		world.p.on("pre-solve", (contact) => {
			const fixA = contact.getFixtureA();
			const fixB = contact.getFixtureB();
			const userA = fixA.getUserData() as PhysObjUserData;
			const userB = fixB.getUserData() as PhysObjUserData;

			if (userA == null || userB == null) return;

			const classA = getClassFromID(userA.goid);
			const classB = getClassFromID(userB.goid);

			if (userA.id != this.id && userB.id != this.id) return;

			this.checkStomp(fixA, fixB, userA, userB, classA, classB, world);
		});
	}
	checkStomp(
		fixA: Fixture,
		fixB: Fixture,
		userA: PhysObjUserData,
		userB: PhysObjUserData,
		classA: typeof GameObject,
		classB: typeof GameObject,
		world: World,
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
		const stomp = fix.getBody().getLinearVelocity().y > 0;
		if (!stomp) return;

		const enemyUser = classA == Player ? userB : userA;
		const playerUser = classA == Player ? userA : userB;
		const enemyFix = classA == Player ? fixB : fixA;
		const playerFix = classA == Player ? fixA : fixB;

		world.p.queueUpdate(() => {
			this.onStomp(enemyUser, playerUser, enemyFix, playerFix, world);
		});
	}
	checkSide(fixA: Fixture, fixB: Fixture, contact: Contact, world: World) {
		if (
			fixA != this.leftWallSensor &&
			fixB != this.leftWallSensor &&
			fixA != this.rightWallSensor &&
			fixB != this.rightWallSensor
		)
			return;
		if (!contact.isTouching()) return;
		if (fixA.isSensor() && fixB.isSensor()) return;

		const userA = fixA.getUserData() as PhysObjUserData;
		const userB = fixB.getUserData() as PhysObjUserData;
		const other = userA == null ? userB : userA;
		const sensorFix = userA == null ? fixA : fixB;
		const otherFix = userA == null ? fixB : fixA;
		if (otherFix.getBody().getLinearVelocity().y > 0) return;
		world.p.queueUpdate(() => {
			this.onSideTouch(other, sensorFix, otherFix, world);
		});
	}
	onSideTouch(
		_userData: PhysObjUserData,
		_sensorFix: Fixture,
		_otherFix: Fixture,
		_world: World,
	) {
		if (_userData.goid == GOID.Player) {
			_world.removeEntity(_userData.id);
		} else {
			this.direction = _sensorFix == this.leftWallSensor ? 1 : -1;
			this.body.setLinearVelocity(new Vec2(this.speed * this.direction, 0));
		}
	}
	onStomp(
		_enemyUser: PhysObjUserData,
		_playerUser: PhysObjUserData,
		_enemyFix: Fixture,
		_playerFix: Fixture,
		_world: World,
	): void {
		_world.removeEntity(this.id);
		const player = _world.entities.find(
			(v) => v.id == _playerUser.id,
		) as Player;
		player.body.applyForceToCenter(new Vec2(0, -500), true);
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
	get direction() {
		return this._direction;
	}
	set direction(direction: number) {
		this._direction = direction;
		this.sprite.scale.x = direction;
	}
}
