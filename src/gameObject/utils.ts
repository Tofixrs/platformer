import { Goomba } from "@gameObjs/goomba";
import { Grass } from "@gameObjs/grass";
import { Ice } from "@gameObjs/ice";
import { Koopa } from "@gameObjs/koopa";
import { Player } from "@gameObjs/player";
import { GameObject, GameObjectID, GOID } from "gameObject";
import { Brick } from "@gameObjs/brick";
import { Mushroom } from "@gameObjs/mushroom";
import { MarkBlock } from "@gameObjs/markBlock";
import { Rock } from "@gameObjs/rock";
import { DeathPlane } from "@gameObjs/deathPlane";
import { Flag } from "@gameObjs/flag";

export function getClassFromID(id: GameObjectID): typeof GameObject {
	switch (id) {
		case GOID.Player: {
			//@ts-expect-error
			return Player;
		}
		case GOID.Grass: {
			//@ts-expect-error
			return Grass;
		}
		case GOID.Goomba: {
			//@ts-expect-error
			return Goomba;
		}
		case GOID.Koopa: {
			//@ts-expect-error
			return Koopa;
		}
		case GOID.Ice: {
			//@ts-expect-error
			return Ice;
		}
		case GOID.Brick: {
			//@ts-expect-error
			return Brick;
		}
		case GOID.Mushroom: {
			//@ts-expect-error
			return Mushroom;
		}
		case GOID.MarkBlock: {
			//@ts-expect-error
			return MarkBlock;
		}
		case GOID.Rock: {
			//@ts-expect-error
			return Rock;
		}
		case GOID.DeathPlane: {
			//@ts-expect-error
			return DeathPlane;
		}
		case GOID.Flag: {
			//@ts-expect-error
			return Flag;
		}
	}
}
