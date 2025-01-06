import { capsule } from "@lib/shape";
import { GameObject, GOID, PropertyValue } from "gameObject";
import { Enemy } from "gameObject/types/enemy";
import { ColorMatrixFilter, DisplacementFilter, Sprite } from "pixi.js";
import { Fixture, Shape, Vec2 } from "planck";
import { World } from "world";
import { Player } from "./player";
import { PhysObjUserData } from "gameObject/types/physicsObject";

export class Sushroom extends Enemy {
	constructor(pos: Vec2, direction?: number) {
		super({
			pos,
			shape: capsule(new Vec2(0.23, 0.23)),
			density: 0.5,
			friction: 1,
			goid: GOID.Sushroom,
			sprite: Sprite.from("sushroom"),
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
		return new Sushroom(pos, Number(direction?.value));
	}
	create(world: World): void {
		super.create(world);
	}
	update(dt: number, world: World): void {
		super.update(dt, world);
		const vel = this.body.getLinearVelocity();
		this.body.setLinearVelocity(new Vec2(3 * this.direction, vel.y));
	}
	onStomp(
		_enemyUser: PhysObjUserData,
		_playerUser: PhysObjUserData,
		_enemyFix: Fixture,
		_playerFix: Fixture,
		world: World,
	): void {
		this.applyFilter(world);
	}
	onSideTouch(
		userData: PhysObjUserData,
		_sensorFix: Fixture,
		_otherFix: Fixture,
		world: World,
	): void {
		if (userData.goid != GOID.Player) return;
		this.applyFilter(world);
	}
	applyFilter(world: World) {
		world.removeEntity(this.id);

		const colorMatrix = new ColorMatrixFilter();
		colorMatrix.matrix = [
			1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0,
		];
		const filter = new DisplacementFilter({
			sprite: Sprite.from("displacement"),
			scale: 50,
		});
		world.c.filters = [colorMatrix, filter];
	}
}
