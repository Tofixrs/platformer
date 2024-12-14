import { SerializedGO } from "@lib/serialize";
import { GameObject, GOID, PropertyValue } from "gameObject";
import { PhysicsObject, PhysObjUserData } from "gameObject/types/physicsObject";
import { Box, Shape, Vec2 } from "planck-js";
import { World } from "world";

export class DeathPlane extends PhysicsObject {
	killId?: string;
	constructor(pos: Vec2) {
		super({
			pos,
			goid: GOID.DeathPlane,
			density: 0,
			friction: 0,
			shape: new Box(2137, 1),
			fixedRotation: true,
			bodyType: "static",
		});
	}
	update(_dt: number, world: World): void {
		if (!this.killId) return;

		world.removeEntity(this.killId, true, true);
	}
	create(world: World): void {
		super.create(world);

		world.p.on("pre-solve", (contact) => {
			const fixA = contact.getFixtureA();
			const fixB = contact.getFixtureB();
			if (fixA != this.mainFix && fixB != this.mainFix) return;
			const worldManifold = contact.getWorldManifold(null);
			if (worldManifold?.normal.x == 0 && worldManifold.normal.y == 0) return;
			const userA = fixA.getUserData() as PhysObjUserData;
			const userB = fixB.getUserData() as PhysObjUserData;
			if (!userA || !userB) return;

			const other = userA.goid == GOID.DeathPlane ? userB : userA;

			this.killId = other.id;
			contact.setEnabled(false);
		});
	}
	static commonConstructor(
		pos: Vec2,
		_shape: Shape,
		_startPos: Vec2,
		_currPos: Vec2,
		_props?: PropertyValue[],
	): GameObject {
		return new DeathPlane(pos);
	}
	serialize(): SerializedGO {
		return {
			_type: GOID.DeathPlane,
			data: {
				pos: this.pos,
			},
		};
	}
	static deserialize(obj: SerializedGO): GameObject {
		return new DeathPlane(new Vec2(obj.data.pos.x, obj.data.pos.y));
	}
}
