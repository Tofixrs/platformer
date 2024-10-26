import { World } from "world";

export interface GameObjectOptions {}

export class GameObject {
	constructor({}: GameObjectOptions) {}
	update(_dt: number, _world: World) {}
	fixedUpdate() {}
	create(_world: World) {}
}
