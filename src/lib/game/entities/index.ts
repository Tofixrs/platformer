import { Sprite, Ticker } from "pixi.js";
import { World } from "../world";
import { Body, Shape, Vec2 } from "planck-js";
import { planckToPixiPos } from "@lib/math/units";

interface EntityOptions {
	pos: Vec2;
	shape: Shape;
	sprite: Sprite;
	density: number;
	friction: number;
	bodyType: "static" | "dynamic";
	world: World;
	type: "ent" | "ground";
}
export class Entity {
	public sprite: Sprite;
	public body?: Body;
	public shape: Shape;
	public density: number;
	public bodyType: "static" | "dynamic";
	public friction: number;
	public type: "ent" | "ground";
	constructor(options: EntityOptions) {
		const { sprite, pos, shape, density, friction, type, bodyType } = options;
		this.sprite = sprite;

		this.sprite.position.set(pos.x, pos.y);
		this.sprite.anchor.set(0.5, 0.5);
		this.shape = shape;
		this.density = density;
		this.friction = friction;
		this.bodyType = bodyType;
		this.type = type;
	}
	isInWorld() {
		if (this.body) return true;

		return false;
	}
	_update(ticker: Ticker, world: World) {
		if (!this.isInWorld()) return;
		const pos = planckToPixiPos(this.body!.getPosition());
		this.sprite.x = pos.x;
		this.sprite.y = pos.y;
		this.sprite.rotation = this.body!.getAngle();
		this.update(ticker, world);
	}
	onCreate(world: World) {}
	update(ticker: Ticker, world: World) {}
}
