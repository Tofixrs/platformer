import { GameObject } from "gameObject";
import { MouseHandler } from "./mouseHandler";
import { Box, Transform, Vec2 } from "planck-js";
import { pixiToPlanck } from "@lib/math/units";
import { getClassFromID } from "gameObject/utils";
import { Player } from "@gameObjs/player";
import { Ground } from "@gameObjs/ground";
import { Editor, getPosAtGrid } from ".";
import { Goomba } from "@gameObjs/goomba";

export class ObjectPlacer {
	mouseHandler = new MouseHandler(new Vec2(0, 0));
	worldRef: Editor;
	testing = false;
	constructor(world: Editor) {
		this.worldRef = world;
		world.main.addChild(this.mouseHandler.dragContainer);
	}
	update(pivot: Vec2, world: Editor) {
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
		this.worldRef.entities.forEach((v, i) => {
			const transform = new Transform(v.pos, 0);
			if (!v.shape.testPoint(transform, pos)) return;
			this.worldRef.removeEntity(v, i);
		});
	}
	checkCreate(world: Editor) {
		if (this.testing) return;
		if (this.worldRef.ui.erase) return;
		if (
			!this.mouseHandler.finishedPos ||
			!this.mouseHandler.finishedSize ||
			!this.worldRef.ui.selected
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
		let go!: GameObject;

		switch (selectedClass) {
			//@ts-expect-error TS stop being stuped
			case Player: {
				go = new Player(physPos);
				break;
			}
			//@ts-expect-error
			case Ground: {
				go = new Ground({
					friction: 0.5,
					shape: new Box(physSize.x, physSize.y),
					pos: physPos,
				});
				break;
			}
			//@ts-expect-error TS stop being stuped
			case Goomba: {
				go = new Goomba(physPos);
				break;
			}
		}
		this.mouseHandler.reset();
		this.worldRef.addEntity(go);
	}
}
