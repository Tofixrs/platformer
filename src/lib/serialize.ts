import { Ground } from "@gameObjs/ground";
import { Player } from "@gameObjs/player";
import { GameObject, GameObjectID, GOID } from "gameObject";
import { Box, Polygon, Vec2 } from "planck-js";
import { World } from "world";

export interface SerializedGO {
	_type: GameObjectID;
	data: any;
}

export function serializeWorld(world: World) {
	return JSON.stringify(world.entities.map((v) => serialize(v)));
}

export function deserializeWorld(s: string) {
	return (JSON.parse(s) as SerializedGO[]).map((v) => deserialize(v));
}

//@ts-expect-error
export function serialize(v: GameObject): SerializedGO {
	if (v instanceof Player) return sPlayer(v);
	if (v instanceof Ground) return sGround(v);
}

function sPlayer(v: Player): SerializedGO {
	return {
		_type: GOID.Player,
		data: v.pos,
	};
}

function dPlayer(v: SerializedGO): Player {
	return new Player(new Vec2(v.data.x, v.data.y));
}

function sGround(v: Ground): SerializedGO {
	return {
		_type: GOID.Ground,
		data: {
			pos: v.pos,
			shapeVerts: (v.shape as Polygon).m_vertices,
			friction: v.friction,
		},
	};
}

function dGround(v: SerializedGO): Ground {
	const verts = v.data.shapeVerts.map((v: any) => new Vec2(v.x, v.y));
	const shape = new Polygon(verts);
	return new Ground({
		friction: v.data.friction,
		pos: new Vec2(v.data.pos.x, v.data.pos.y),
		density: 0,
		fixedRotation: true,
		shape,
		bodyType: "static",
	});
}

export function deserialize(v: SerializedGO): GameObject {
	switch (v._type) {
		case GOID.Player: {
			return dPlayer(v);
		}
		case GOID.Ground: {
			return dGround(v);
		}
	}
}
