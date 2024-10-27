import { Vec2 } from "planck-js";
import { World } from "world";

export interface GameObjectOptions {}

export class GameObject {
	static draggable = false;
	constructor({}: GameObjectOptions) {}
	update(_dt: number, _world: World) {}
	fixedUpdate() {}
	create(_world: World) {}
	static renderDrag(startPos: Vec2, currPos: Vec2) {}
}

export enum GameObjectID {
	Player = "player",
	Ground = "ground",
}
