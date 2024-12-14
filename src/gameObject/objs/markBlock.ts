import {
	GameObject,
	GameObjectID,
	GOID,
	Property,
	PropertyValue,
	PropType,
} from "gameObject";
import { Block } from "gameObject/types/block";
import { AnimatedSprite, Sprite, Texture, TextureSource } from "pixi.js";
import { Box, Shape, Vec2 } from "planck-js";
import { World } from "world";
import { getClassFromID } from "gameObject/utils";
import { Ground } from "gameObject/types/ground";
import { ActionState, Player, PowerState } from "./player";
import { SerializedGO } from "@lib/serialize";

export class MarkBlock extends Block {
	static dragTexture: Texture<TextureSource<any>> = Texture.from("brick");
	static props: Property[] = [
		{ name: "item", type: PropType.goid, defaultValue: "" },
	];
	item?: GameObjectID;
	static draggable: boolean = false;
	animSprite: AnimatedSprite;
	hitSprite = Sprite.from("mark_hit");
	currSprite: "anim" | "hit" = "anim";
	constructor(pos: Vec2, item?: GameObjectID) {
		const anim = new AnimatedSprite([
			Texture.from("mark_anim_1"),
			Texture.from("mark_anim_1"),
			Texture.from("mark_anim_1"),
			Texture.from("mark_anim_1"),
			Texture.from("mark_anim_1"),
			Texture.from("mark_anim_1"),
			Texture.from("mark_anim_1"),
			Texture.from("mark_anim_2"),
			Texture.from("mark_anim_3"),
		]);
		anim.animationSpeed = 0.18;
		anim.play();

		super({
			friction: 0.2,
			sprite: anim,
			pos,
			goid: GOID.MarkBlock,
		});
		this.animSprite = anim;
		this.item = item;
		this.doneSprite = !this.item;
		this.hitSprite.x = this.animSprite.x;
		this.hitSprite.y = this.animSprite.y;
		this.hitSprite.anchor.set(0.5, 0.5);
	}
	static commonConstructor(
		pos: Vec2,
		_shape: Shape,
		_startPos: Vec2,
		_currPos: Vec2,
		props?: PropertyValue[],
	): GameObject {
		const item = props?.find((v) => v.name == "item");
		return new MarkBlock(pos, item?.value as GameObjectID);
	}
	update(dt: number, world: World): void {
		super.update(dt, world);
		if (
			(this.sprite.y - this.defaultSpritePos.y < -8 ||
				this.sprite.y - this.defaultSpritePos.y > 8) &&
			this.currSprite != "hit"
		) {
			this.doneSprite = true;
			this.hitSprite.position = this.animSprite.position;
		}
	}
	set doneSprite(yes: boolean) {
		this.sprite = yes ? this.hitSprite : this.animSprite;
		this.hitSprite.visible = yes;
		this.animSprite.visible = !yes;
		this.currSprite = yes ? "hit" : "anim";
	}
	remove(world: World, force?: boolean): boolean {
		super.remove(world, force);
		world.main.removeChild(this.animSprite);
		world.main.removeChild(this.hitSprite);

		return true;
	}
	create(world: World): void {
		super.create(world);
		world.main.addChild(this.hitSprite);
	}
	onHit(world: World): boolean {
		super.onHit(world);
		if (this.hitSide == 1) {
			const player = world.entities.find((v) => this.hitID == v.id) as Player;
			if (player.powerState < PowerState.Big) return false;
			if (!player.actionStates.includes(ActionState.GroundPound)) return false;
		}
		if (!this.item) {
			this.bumpSound.play();
			return true;
		}
		const item = getClassFromID(this.item);
		if (!item) {
			this.bumpSound.play();
			return true;
		}

		const pos = this.pos.clone();
		pos.y -= -this.hitSide! * 0.75;
		if (item.prototype instanceof Ground) return true;
		const go = item.commonConstructor(
			pos,
			new Box(0, 0),
			Vec2.zero(),
			Vec2.zero(),
			[{ type: "number", name: "instant", value: "1" }],
		);
		world.addEntity(go);
		this.item = undefined;

		return true;
	}
	serialize(): SerializedGO {
		return {
			_type: this.goid,
			data: {
				pos: this.pos,
				item: this.item,
			},
		};
	}
	static deserialize(obj: SerializedGO): GameObject {
		return new MarkBlock(
			new Vec2(obj.data.pos.x, obj.data.pos.y),
			obj.data.item,
		);
	}
}
