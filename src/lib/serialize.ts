import { Brick } from "@gameObjs/brick";
import { Goomba } from "@gameObjs/goomba";
import { Grass } from "@gameObjs/grass";
import { Ice } from "@gameObjs/ice";
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
	if (v instanceof Grass) return sGrass(v);
	if (v instanceof Goomba) return sGoomba(v);
	if (v instanceof Koopa) return sKoopa(v);
	if (v instanceof Ice) return sIce(v);
	if (v instanceof Brick) return sBricks(v);
}

function sPlayer(v: Player): SerializedGO {
	return {
		_type: GOID.Player,
		data: {
			pos: v.pos,
			pState: v.powerState,
		},
	};
}

function dPlayer(v: SerializedGO): Player {
	return new Player(new Vec2(v.data.pos.x, v.data.pos.y), v.data.pState);
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

function sGrass(v: Grass): SerializedGO {
	return {
		_type: GOID.Grass,
		data: {
			pos: v.pos,
			shapeVerts: (v.shape as Polygon).m_vertices,
			friction: v.friction,
		},
	};
}

function dBricks(v: SerializedGO): Brick {
	return new Brick(new Vec2(v.data.pos.x, v.data.pos.y));
}

function sBricks(v: Brick): SerializedGO {
	return {
		_type: GOID.Brick,
		data: {
			pos: v.pos,
		},
	};
}

function dGrass(v: SerializedGO): Grass {
	const verts = v.data.shapeVerts.map((v: any) => new Vec2(v.x, v.y));
	const shape = new Polygon(verts);
	return new Grass(new Vec2(v.data.pos.x, v.data.pos.y), shape);
}

function sIce(v: Ice): SerializedGO {
	return {
		_type: GOID.Ice,
		data: {
			pos: v.pos,
			shapeVerts: (v.shape as Polygon).m_vertices,
			friction: v.friction,
		},
	};
}

function dIce(v: SerializedGO): Grass {
	const verts = v.data.shapeVerts.map((v: any) => new Vec2(v.x, v.y));
	const shape = new Polygon(verts);
	return new Ice(new Vec2(v.data.pos.x, v.data.pos.y), shape);
}

export function deserialize(v: SerializedGO): GameObject {
	switch (v._type) {
		case GOID.Player: {
			return dPlayer(v);
		}
		case GOID.Grass: {
			return dGrass(v);
		}
		case GOID.Ice: {
			return dIce(v);
		}
		case GOID.Goomba: {
			return dGoomba(v);
		}
		case GOID.Koopa: {
			return dKoopa(v);
		}
		case GOID.Brick: {
			return dBricks(v);
		}
	}
}
