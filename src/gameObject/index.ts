import { Container } from "pixi.js";
import { Shape, Vec2 } from "planck-js";
import { World } from "world";

export interface GameObjectOptions {
	pos: Vec2;
	shape: Shape;
	goid: GameObjectID;
}

export abstract class GameObject {
	static draggable = false;
	static maxInstances?: number;
	pos: Vec2;
	shape: Shape;
	goid: GameObjectID;
	id: string;
	constructor({ pos, shape, goid: id }: GameObjectOptions) {
		this.pos = pos;
		this.shape = shape;
		this.goid = id;
		this.id = window.crypto.randomUUID();
	}
	update(_dt: number, _world: World) {}
	pausedUpdate(_dt: number, _world: World) {}
	fixedUpdate() {}
	create(_world: World) {}
	remove(_world: World, _force: boolean = false): boolean {
		return true;
	}
	static renderDrag(_startPos: Vec2, _currPos: Vec2, _container: Container) {}
}

export const GOID = {
	Player: "player",
	Grass: "grass",
	Ice: "ice",
	Goomba: "goomba",
	Koopa: "koopa",
	Brick: "brick",
} as const;

type GOIOKeys = keyof typeof GOID;
export type GameObjectID = (typeof GOID)[GOIOKeys];
