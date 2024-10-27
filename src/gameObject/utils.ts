import { Ground } from "@gameObjs/ground";
import { Player } from "@gameObjs/player";
import { GameObject, GameObjectID } from "gameObject";

export function getClassFromID(id: GameObjectID): typeof GameObject {
	switch (id) {
		case GameObjectID.Player: {
			return Player;
		}
		case GameObjectID.Ground: {
			return Ground;
		}
	}
}
