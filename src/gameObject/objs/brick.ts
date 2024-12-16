import { GameObject, GOID, PropertyValue } from "gameObject";
import { Block } from "gameObject/types/block";
import { Sprite, Texture, TextureSource } from "pixi.js";
import { Shape, Vec2 } from "planck";
import { World } from "world";
import { ActionState, Player, PowerState } from "./player";

export class Brick extends Block {
	static dragTexture: Texture<TextureSource<any>> = Texture.from("brick");
	breakSound = new Howl({
		src: ["./sounds/breakblock.wav"],
		volume: 1,
	});
	constructor(pos: Vec2) {
		super({
			friction: 0.75,
			sprite: Sprite.from("brick"),
			pos,
			goid: GOID.Brick,
		});
		this.breakSound.pos(pos.x, pos.y);
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
		if (player.powerState < PowerState.Big) {
			this.bumpSound.play();
			return true;
		}

		this.breakSound.play();
		world.removeEntity(this.id);
		return false;
	}
	remove(world: World, force?: boolean): boolean {
		if (!force) this.breakSound.play();
		return super.remove(world, force);
	}
}
