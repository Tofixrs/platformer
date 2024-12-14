import { capsule } from "@lib/shape";
import { GameObject, GOID, Property, PropertyValue } from "gameObject";
import { Sprite } from "pixi.js";
import { Contact, Shape, Vec2 } from "planck";
import { World } from "world";
import { Entity } from "gameObject/types/entity";
import { SerializedGO } from "@lib/serialize";
import { planckToPixi } from "@lib/math/units";

export class Coin extends Entity {
	collected = false;
	anim = false;
	swapDirection = false;
	defaultSpritePos: Vec2;
	static props: Property[] = [
		{ name: "instant", defaultValue: "0", type: "number" },
	];
	coinSound = new Howl({
		src: ["./sounds/coin.mp3"],
		volume: 0.25,
	});

	constructor(pos: Vec2, instant: boolean = false) {
		super({
			pos,
			shape: capsule(new Vec2(0.23, 0.23)),
			density: 0,
			friction: 0,
			goid: GOID.Coin,
			sprite: Sprite.from("coin"),
			bodyType: "static",
			fixedRotation: true,
		});
		this.sprite.anchor.set(0.5, 0.5);
		this.anim = instant;
		this.defaultSpritePos = planckToPixi(pos);
		this.coinSound.pos(this.pos.x, this.pos.y);
	}
	static commonConstructor(
		pos: Vec2,
		_shape: Shape,
		_startPos: Vec2,
		_currPos: Vec2,
		props: PropertyValue[],
	): GameObject {
		const instant = props.find((v) => v.name == "instant");
		return new Coin(pos, instant?.value == "1");
	}
	create(world: World): void {
		super.create(world);

		world.p.on("begin-contact", (contact) => {
			this.onBegin(contact);
		});
	}
	update(dt: number, _world: World): void {
		if (this.collected || this.anim) {
			if (!this.coinSound.playing()) this.coinSound.play();
			if (
				this.sprite.y - this.defaultSpritePos.y < -16 &&
				!this.swapDirection
			) {
				this.swapDirection = true;
			}
			this.sprite.y -= dt * 150 * (this.swapDirection ? -1 : 1);
			if (this.sprite.y > this.defaultSpritePos.y) {
				this.anim = false;
				this.swapDirection = false;
				this.sprite.x = this.defaultSpritePos.x;
				this.sprite.y = this.defaultSpritePos.y;
				this.collected = true;
			}
			return;
		}
		for (let cList = this.body.getContactList(); cList; cList = cList.next!) {
			if (cList.contact.isTouching()) {
				this.collected = true;
				break;
			}
		}
	}
	onBegin(contact: Contact) {
		const fixA = contact.getFixtureA();
		const fixB = contact.getFixtureB();
		if (fixA != this.mainFix && fixB != this.mainFix) return;
		if (!contact.isTouching()) return;
		this.collected = true;
		contact.setEnabled(false);
	}
	serialize(): SerializedGO {
		return {
			_type: this.goid,
			data: this.pos,
		};
	}
	static deserialize(obj: SerializedGO): GameObject {
		return new Coin(new Vec2(obj.data.x, obj.data.y));
	}
}
