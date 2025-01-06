import { capsule } from "@lib/shape";
import { GameObject, GOID, PropertyValue } from "gameObject";
import { Enemy } from "gameObject/types/enemy";
import { Sprite } from "pixi.js";
import { Fixture, Shape, Vec2 } from "planck";
import { World } from "world";
import { Player } from "./player";
import { PhysObjUserData } from "gameObject/types/physicsObject";

export class OneUp extends Enemy {
	collected = false;
	oneUpSound = new Howl({
		src: ["./sounds/1up.wav"],
		volume: 0.25,
	});
	constructor(pos: Vec2, direction?: number) {
		super({
			pos,
			shape: capsule(new Vec2(0.23, 0.23)),
			density: 0.5,
			friction: 1,
			goid: GOID.OneUp,
			sprite: Sprite.from("1up"),
			direction: direction || 1,
		});
		this.sprite.anchor.set(0.5, 0.5);
	}
	static commonConstructor(
		pos: Vec2,
		_shape: Shape,
		_startPos: Vec2,
		_currPos: Vec2,
		props: PropertyValue[],
	): GameObject {
		const direction = props.find((v) => v.name == "direction");
		return new OneUp(pos, Number(direction?.value));
	}
	create(world: World): void {
		super.create(world);
	}
	update(dt: number, world: World): void {
		super.update(dt, world);
		const vel = this.body.getLinearVelocity();
		this.body.setLinearVelocity(new Vec2(3 * this.direction, vel.y));
	}
	onSideTouch(
		userData: PhysObjUserData,
		_fixA: Fixture,
		_fixB: Fixture,
		world: World,
	): void {
		const ent = world.entities.find((v) => v.id == userData.id);
		if (ent instanceof Player) {
			this.collected = true;
		} else {
			this.direction = -this.direction;
			const vel = this.body.getLinearVelocity();
			this.body.setLinearVelocity(new Vec2(this.direction * this.speed, vel.y));
		}
	}
	onStomp(
		_enemyUser: PhysObjUserData,
		_playerUser: PhysObjUserData,
		_enemyFix: Fixture,
		_playerFix: Fixture,
		_world: World,
	): void {
		this.collected = true;
		if (!this.oneUpSound.playing()) this.oneUpSound.play();
	}
}
