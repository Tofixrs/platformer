import { capsule } from "@lib/shape";
import { GameObject, GOID, PropertyValue } from "gameObject";
import { Enemy } from "gameObject/types/enemy";
import { ColorMatrixFilter, DisplacementFilter, Sprite } from "pixi.js";
import { Box, Contact, Fixture, Shape, Vec2 } from "planck";
import { World } from "world";
import { Player } from "./player";

export class Sushroom extends Enemy {
	rightWallSensor!: Fixture;
	leftWallSensor!: Fixture;
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
		this.rightWallSensor = this.body.createFixture({
			shape: new Box(0.01, 0.1, new Vec2(0.29, 0)),
			isSensor: true,
			filterMaskBits: 10,
		});

		this.leftWallSensor = this.body.createFixture({
			shape: new Box(0.01, 0.1, new Vec2(-0.29, 0)),
			isSensor: true,
			filterMaskBits: 10,
		});

		world.p.on("begin-contact", (contact) => {
			this.onBegin(contact);
		});
	}
	update(dt: number, world: World): void {
		super.update(dt, world);
		const vel = this.body.getLinearVelocity();
		this.body.setLinearVelocity(new Vec2(3 * this.direction, vel.y));
	}
	onStomp(world: World): void {
		const ent = world.entities.find((v) => v.id == this.sideTouchID);
		if (!(ent instanceof Player)) return;

		this.applyFilter(ent, world);
	}
	onSideTouch(world: World): void {
		const ent = world.entities.find((v) => v.id == this.sideTouchID);
		if (!(ent instanceof Player)) return;

		this.applyFilter(ent, world);
	}
	applyFilter(player: Player, world: World) {
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
	onBegin(contact: Contact) {
		const fixA = contact.getFixtureA();
		const fixB = contact.getFixtureB();
		if (
			fixA != this.leftWallSensor &&
			fixB != this.leftWallSensor &&
			fixA != this.rightWallSensor &&
			fixB != this.rightWallSensor
		)
			return;
		if (!contact.isTouching()) return;

		this.direction =
			fixA == this.leftWallSensor || fixB == this.leftWallSensor ? 1 : -1;
		this.body.setLinearVelocity(new Vec2(3 * this.direction, 0));
	}
}
