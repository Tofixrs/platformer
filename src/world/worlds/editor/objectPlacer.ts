import { MouseHandler } from "./mouseHandler";
import { Box, Transform, Vec2 } from "planck-js";
import { pixiToPlanck } from "@lib/math/units";
import { getClassFromID } from "gameObject/utils";
import { Player, PowerState } from "@gameObjs/player";
import { Editor, getPosAtGrid } from ".";
import { Goomba } from "@gameObjs/goomba";
import { Koopa } from "@gameObjs/koopa";
import { Grass } from "@gameObjs/grass";
import { Ice } from "@gameObjs/ice";
import { Brick } from "@gameObjs/brick";
import { fillBlocks } from "gameObject/types/block";

export class ObjectPlacer {
	mouseHandler = new MouseHandler(new Vec2(0, 0));
	worldRef: Editor;
	testing = false;
	constructor(world: Editor) {
		this.worldRef = world;
		world.main.addChild(this.mouseHandler.dragContainer);
	}
	update(pivot: Vec2, world: Editor) {
		if (this.testing) this.mouseHandler.reset();
		this.uiHack();
		this.mouseHandler.update(
			pivot,
			this.testing,
			this.worldRef.ui.erase,
			this.worldRef.ui.selected,
		);
		this.checkCreate(world);
		this.checkErase();
	}
	uiHack() {
		if (this.worldRef.ui.dontPlace) {
			this.mouseHandler.reset();
			this.worldRef.ui.dontPlace = false;
			return;
		}
	}
	checkErase() {
		if (this.testing) return;
		if (!this.worldRef.ui.erase) return;
		if (!this.mouseHandler.currPos) return;

		const pos = pixiToPlanck(getPosAtGrid(this.mouseHandler.currPos));
		const foundEnt = this.worldRef.entities.findIndex((v) => {
			const transform = new Transform(v.pos, 0);
			return v.shape.testPoint(transform, pos);
		});
		this.worldRef.removeEntityIndex(foundEnt, true);
	}
	checkCreate(world: Editor) {
		if (this.testing) return;
		if (this.worldRef.ui.erase) return;
		if (
			!this.mouseHandler.finishedPos ||
			!this.mouseHandler.finishedSize ||
			!this.worldRef.ui.selected ||
			!this.mouseHandler.finishedDragStartPos ||
			!this.mouseHandler.finishedDragEndPos
		)
			return;
		const physPos = pixiToPlanck(this.mouseHandler.finishedPos);
		const physSize = pixiToPlanck(this.mouseHandler.finishedSize);
		const selectedClass = getClassFromID(this.worldRef.ui.selected);
		if (selectedClass.maxInstances) {
			const amount = world.entities.filter(
				(v) => v instanceof selectedClass,
			).length;
			if (amount >= selectedClass.maxInstances) return;
		}

		switch (selectedClass) {
			//@ts-expect-error TS stop being stuped
			case Player: {
				this.worldRef.addEntity(new Player(physPos, PowerState.Small));
				break;
			}
			//@ts-expect-error TS stop being stuped
			case Grass: {
				this.worldRef.addEntity(
					new Grass(physPos, new Box(physSize.x, physSize.y)),
				);
				break;
			}
			//@ts-expect-error TS stop being stuped
			case Ice: {
				this.worldRef.addEntity(
					new Ice(physPos, new Box(physSize.x, physSize.y)),
				);
				break;
			}
			//@ts-expect-error TS stop being stuped
			case Goomba: {
				this.worldRef.addEntity(new Goomba(physPos));
				break;
			}
			//@ts-expect-error TS stop being stuped
			case Koopa: {
				this.worldRef.addEntity(new Koopa(physPos));
				break;
			}
			//@ts-expect-error TS stop being stuped
			case Brick: {
				fillBlocks(
					world,
					this.mouseHandler.finishedDragStartPos,
					this.mouseHandler.finishedDragEndPos,
					//@ts-expect-error
					Brick,
				);
				break;
			}
		}
		this.mouseHandler.reset();
	}
}
