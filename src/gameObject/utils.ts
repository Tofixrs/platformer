import { Goomba } from "@gameObjs/goomba";
import { Ground } from "@gameObjs/ground";
import { Koopa } from "@gameObjs/koopa";
import { Player } from "@gameObjs/player";
import { GameObject, GameObjectID, GOID } from "gameObject";

export function getClassFromID(id: GameObjectID): typeof GameObject {
	switch (id) {
		case GOID.Player: {
			//@ts-expect-error
			return Player;
		}
		case GOID.Ground: {
			//@ts-expect-error
			return Ground;
		}
		case GOID.Goomba: {
			//@ts-expect-error
			return Goomba;
		}
		case GOID.Koopa: {
			//@ts-expect-error
			return Koopa;
		}
	}
}
