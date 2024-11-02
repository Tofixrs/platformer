import { Container } from "pixi.js";
import { Shape, Vec2 } from "planck-js";
import { World } from "world";

export interface GameObjectOptions {
	pos: Vec2;
	shape: Shape;
}

export abstract class GameObject {
	static draggable = false;
	static maxInstances?: number;
	pos: Vec2;
	shape: Shape;
	constructor({ pos, shape }: GameObjectOptions) {
		this.pos = pos;
		this.shape = shape;
	}
	update(_dt: number, _world: World) {}
	fixedUpdate() {}
	create(_world: World) {}
	remove(_world: World) {}
	static renderDrag(_startPos: Vec2, _currPos: Vec2, _container: Container) {}
}

export const GOID = {
	Player: "player",
	Ground: "ground",
} as const;

type GOIOKeys = keyof typeof GOID;
export type GameObjectID = (typeof GOID)[GOIOKeys];
