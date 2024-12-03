import { capsule } from "@lib/shape";
import { GameObject, GOID, Property, PropertyValue } from "gameObject";
import { Sprite } from "pixi.js";
import { Contact, Shape, Vec2 } from "planck-js";
import { World } from "world";
import { Entity } from "gameObject/types/entity";
import { SerializedGO } from "@lib/serialize";

export class Coin extends Entity {
	collected = false;
	static props: Property[] = [
		{ name: "instant", defaultValue: "0", type: "number" },
	];

	constructor(pos: Vec2, instant: boolean = false) {
		super({
			pos,
			shape: capsule(new Vec2(0.23, 0.23)),
			density: 0.5,
			friction: 1,
			goid: GOID.Coin,
			sprite: Sprite.from("1up"),
			bodyType: "dynamic",
			fixedRotation: true,
		});
		this.sprite.anchor.set(0.5, 0.5);
		this.collected = instant;
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
	update(dt: number, world: World): void {
		super.update(dt, world);
		if (this.collected) return;
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
