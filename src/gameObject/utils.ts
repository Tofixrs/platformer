import { Ground } from "@gameObjs/ground";
import { Player } from "@gameObjs/player";
import { GameObject, GameObjectID, GOID } from "gameObject";

export function getClassFromID(id: GameObjectID): typeof GameObject {
	switch (id) {
		case GOID.Player: {
			//@ts-expect-error
			return Player;
		}
		case GOID.Ground: {
			return Ground;
		}
	}
}
