import { GOID } from "gameObject";
import { Block } from "gameObject/types/block";
import { Sprite, Texture, TextureSource } from "pixi.js";
import { Box, Vec2 } from "planck-js";
import { World } from "world";
import { ActionState, Player, PowerState } from "./player";

export class Brick extends Block {
	static dragTexture: Texture<TextureSource<any>> = Texture.from("brick");
	constructor(pos: Vec2) {
		super({
			friction: 0.2,
			sprite: Sprite.from("brick"),
			shape: new Box(0.25, 0.25),
			pos,
			goid: GOID.Brick,
		});
	}
	onHit(world: World): boolean {
		const player = world.entities.find((v) => v.id == this.hitID) as Player;

		if (player.powerState < PowerState.Big) return true;

		const vel = player.body.getLinearVelocity();
		player.body.setLinearVelocity(new Vec2(vel.x, 0));
		player.actionStates = player.actionStates.filter(
			(v) => v != ActionState.Jump,
		);
		world.removeEntity(this.id);
		return false;
	}
}
