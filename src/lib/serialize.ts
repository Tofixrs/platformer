import { GameObjectID } from "gameObject";
import { World } from "world";
import { getClassFromID } from "gameObject/utils";

export interface SerializedGO {
	_type: GameObjectID;
	data: any;
}

export function serializeWorld(world: World) {
	return JSON.stringify(world.entities.map((v) => v.serialize()));
}

export function deserializeWorld(s: string) {
	return (JSON.parse(s) as SerializedGO[]).map((v) => {
		const c = getClassFromID(v._type);
		return c.deserialize(v);
	});
}
