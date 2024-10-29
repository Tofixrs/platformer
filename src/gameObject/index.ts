import { Container } from "pixi.js";
import { Vec2 } from "planck-js";
import { World } from "world";

export interface GameObjectOptions {}

export class GameObject {
	static draggable = false;
	static maxInstances?: number;
	constructor({}: GameObjectOptions) {}
	update(_dt: number, _world: World) {}
	fixedUpdate() {}
	create(_world: World) {}
	static renderDrag(_startPos: Vec2, _currPos: Vec2, _container: Container) {}
}

export enum GameObjectID {
	Player = "player",
	Ground = "ground",
}
