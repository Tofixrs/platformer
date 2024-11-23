import { MouseHandler } from "./mouseHandler";
import { Box, Transform, Vec2 } from "planck-js";
import { pixiToPlanck } from "@lib/math/units";
import { getClassFromID } from "gameObject/utils";
import { Editor, getPosAtGrid } from ".";
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

		//@ts-expect-error
		if (selectedClass == Brick) {
			fillBlocks(
				world,
				this.mouseHandler.finishedDragStartPos,
				this.mouseHandler.finishedDragEndPos,
				selectedClass,
			);
		} else {
			const ent = selectedClass.commonConstructor(
				physPos,
				new Box(physSize.x, physSize.y),
				this.mouseHandler.finishedDragStartPos,
				this.mouseHandler.finishedDragEndPos,
				this.worldRef.ui.propertyValue,
			);
			this.worldRef.addEntity(ent);
		}
		this.mouseHandler.reset();
	}
}
