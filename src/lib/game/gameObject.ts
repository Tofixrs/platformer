import { Ticker } from "pixi.js";
import { World } from "./world";

export interface GameObjectOptions {}

export class GameObject {
	constructor({}: GameObjectOptions) {}
	update(_ticker: Ticker, _world: World) {}
	fixedUpdate() {}
	create(_world: World) {}
}
