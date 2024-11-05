import { Goomba } from "@gameObjs/goomba";
import { Ground } from "@gameObjs/ground";
import { Koopa } from "@gameObjs/koopa";
import { Player } from "@gameObjs/player";
import { GameObject, GameObjectID, GOID } from "gameObject";
import { Polygon, Vec2 } from "planck-js";
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
	if (v instanceof Goomba) return sGoomba(v);
	if (v instanceof Koopa) return sKoopa(v);
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

function sGoomba(v: Goomba): SerializedGO {
	return {
		_type: GOID.Goomba,
		data: v.pos,
	};
}

function dGoomba(v: SerializedGO): Goomba {
	return new Goomba(new Vec2(v.data.x, v.data.y));
}

function dKoopa(v: SerializedGO): Koopa {
	return new Koopa(new Vec2(v.data.x, v.data.y));
}

function sKoopa(v: Koopa): SerializedGO {
	return {
		_type: GOID.Koopa,
		data: v.pos,
	};
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
		shape,
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
		case GOID.Goomba: {
			return dGoomba(v);
		}
		case GOID.Koopa: {
			return dKoopa(v);
		}
	}
}
