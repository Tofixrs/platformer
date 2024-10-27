import { GameObject, GameObjectID } from "gameObject";
import { MouseHandler } from "./mouseHandler";
import { Box, Vec2 } from "planck-js";
import { pixiToPlanck } from "@lib/math/units";
import { getClassFromID } from "gameObject/utils";
import { Player } from "@gameObjs/player";
import { World } from "world";
import { Ground } from "@gameObjs/ground";

export class ObjectPlacer {
	selected?: GameObjectID;
	mouseHandler = new MouseHandler(new Vec2(0, 0));
	worldRef: World;
	testing = false;
	constructor(world: World) {
		this.worldRef = world;
	}
	update(pivot: Vec2) {
		if (this.selected) {
			this.mouseHandler.shouldDrag = getClassFromID(this.selected).draggable;
		} else {
			this.mouseHandler.shouldDrag = false;
		}
		this.mouseHandler.testing = this.testing;
		this.mouseHandler.update(pivot);
		this.create();
	}
	create() {
		if (this.testing) return;
		if (
			!this.mouseHandler.finishedPos ||
			!this.mouseHandler.finishedSize ||
			!this.selected
		)
			return;
		const physPos = pixiToPlanck(this.mouseHandler.finishedPos);
		const physSize = pixiToPlanck(this.mouseHandler.finishedSize);
		const selectedClass = getClassFromID(this.selected);
		let go!: GameObject;

		switch (selectedClass) {
			case Player: {
				go = new Player(physPos);
				break;
			}
			case Ground: {
				go = new Ground({
					bodyType: "static",
					density: 0,
					friction: 0.5,
					fixedRotation: true,
					shape: new Box(physSize.x, physSize.y),
					initPos: physPos,
				});
				break;
			}
		}
		this.mouseHandler.finishedSize = undefined;
		this.mouseHandler.finishedPos = undefined;
		this.worldRef.addEntity(go);
	}
}