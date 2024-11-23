import { Brick } from "@gameObjs/brick";
import { Goomba } from "@gameObjs/goomba";
import { Grass } from "@gameObjs/grass";
import { Ice } from "@gameObjs/ice";
import { Koopa } from "@gameObjs/koopa";
import { MarkBlock } from "@gameObjs/markBlock";
import { Mushroom } from "@gameObjs/mushroom";
import { Player } from "@gameObjs/player";
import { Rock } from "@gameObjs/rock";
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
	if (v instanceof Mushroom) return sMushroom(v);
	if (v instanceof MarkBlock) return sMarkBlock(v);
	if (v instanceof Rock) return sRock(v);
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
		data: {
			pos: v.pos,
			direction: v.direction,
		},
	};
}

function dGoomba(v: SerializedGO): Goomba {
	return new Goomba(new Vec2(v.data.pos.x, v.data.pos.y), v.data.direction);
}

function dKoopa(v: SerializedGO): Koopa {
	return new Koopa(new Vec2(v.data.pos.x, v.data.pos.y), v.data.direction);
}

function sKoopa(v: Koopa): SerializedGO {
	return {
		_type: GOID.Koopa,
		data: {
			pos: v.pos,
			direction: v.direction,
		},
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

function sMushroom(v: Mushroom): SerializedGO {
	return {
		_type: GOID.Mushroom,
		data: {
			pos: v.pos,
			direction: v.direction,
		},
	};
}

function dMushroom(v: SerializedGO): Mushroom {
	return new Mushroom(new Vec2(v.data.pos.x, v.data.pos.y), v.data.direction);
}

function dIce(v: SerializedGO): Ice {
	const verts = v.data.shapeVerts.map((v: any) => new Vec2(v.x, v.y));
	const shape = new Polygon(verts);
	return new Ice(new Vec2(v.data.pos.x, v.data.pos.y), shape);
}

function dMarkBlock(v: SerializedGO): MarkBlock {
	return new MarkBlock(new Vec2(v.data.pos.x, v.data.pos.y), v.data.item);
}

function sMarkBlock(v: MarkBlock): SerializedGO {
	return {
		_type: GOID.MarkBlock,
		data: {
			pos: v.pos,
			item: v.item,
		},
	};
}

function sRock(v: Rock): SerializedGO {
	return {
		_type: GOID.Rock,
		data: {
			pos: v.pos,
			shapeVerts: (v.shape as Polygon).m_vertices,
			friction: v.friction,
		},
	};
}

function dRock(v: SerializedGO): Rock {
	const verts = v.data.shapeVerts.map((v: any) => new Vec2(v.x, v.y));
	const shape = new Polygon(verts);
	return new Rock(new Vec2(v.data.pos.x, v.data.pos.y), shape);
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
		case GOID.Rock: {
			return dRock(v);
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
		case GOID.Mushroom: {
			return dMushroom(v);
		}
		case GOID.MarkBlock: {
			return dMarkBlock(v);
		}
	}
}
