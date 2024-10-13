import { Box, Vec2 } from "planck-js";
import { Entity } from ".";
import { World } from "../world";
import { Sprite } from "pixi.js";

export class Dummy extends Entity {
	constructor(pos: Vec2, world: World) {
		super({
			friction: 0.5,
			shape: new Box(0.25, 0.5),
			world,
			pos,
			sprite: Sprite.from("player_normal"),
			bodyType: "dynamic",
			type: "ent",
			density: 10,
		});
	}
}
