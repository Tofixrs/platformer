import { GameObject, GOID, PropertyValue } from "gameObject";
import { Block } from "gameObject/types/block";
import { Sprite, Texture, TextureSource } from "pixi.js";
import { Shape, Vec2 } from "planck-js";
import { World } from "world";
import { ActionState, Player, PowerState } from "./player";

export class Brick extends Block {
	static dragTexture: Texture<TextureSource<any>> = Texture.from("brick");
	constructor(pos: Vec2) {
		super({
			friction: 0.2,
			sprite: Sprite.from("brick"),
			pos,
			goid: GOID.Brick,
		});
	}
	static commonConstructor(
		pos: Vec2,
		_shape: Shape,
		_startPos: Vec2,
		_currPos: Vec2,
		_props?: PropertyValue[],
	): GameObject {
		return new Brick(pos);
	}
	onHit(world: World): boolean {
		super.onHit(world);
		const player = world.entities.find((v) => v.id == this.hitID) as Player;
		if (
			this.hitSide == 1 &&
			player.actionStates.includes(ActionState.GroundPound)
		) {
			world.removeEntity(this.id);
			player.groundPoundHit = true;
			return false;
		}

		if (this.hitSide == 1) return false;
		if (player.powerState < PowerState.Big) return true;

		world.removeEntity(this.id);
		return false;
	}
}
