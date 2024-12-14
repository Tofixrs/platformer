import { Sprite, Container } from "pixi.js";
import { Vec2 } from "planck";
import { Editor, getGridPosAtPos, getPosAtGrid } from ".";
import { Actions } from "@lib/input";
import { GameObjectID } from "gameObject";
import { getClassFromID } from "gameObject/utils";

export class MouseHandler {
	fakeSprtie?: Sprite;
	dragContainer = new Container();
	startPos?: Vec2;
	currPos?: Vec2;
	lastPos?: Vec2;
	finishedPos?: Vec2;
	finishedDragStartPos?: Vec2;
	finishedDragEndPos?: Vec2;
	finishedSize?: Vec2;
	pivot: Vec2;
	shouldDrag = false;
	testing = false;
	erase = false;
	constructor(pivot: Vec2) {
		this.pivot = pivot;

		window.addEventListener("pointerdown", (ev) => this.startDrag(ev));
		window.addEventListener("pointermove", (ev) => this.updateDrag(ev));
		window.addEventListener("pointerup", (ev) => this.finishDrag(ev));
	}

	render(selected?: GameObjectID) {
		if (this.testing) return;
		if (this.erase) return;
		if (!selected) return;

		if (!this.currPos || !this.startPos || !this.lastPos) return;
		if (this.currPos.x == this.lastPos.x && this.currPos.y == this.lastPos.x)
			return;
		this.lastPos = this.currPos;
		if (!this.shouldDrag) return;

		const drawStartPos = getPosAtGrid(this.startPos);
		const drawEndPos = getPosAtGrid(this.currPos);

		this.clearRender();
		if (drawEndPos.x < drawStartPos.x) {
			const temp = drawStartPos.x;
			drawStartPos.x = drawEndPos.x;
			drawEndPos.x = temp;
		}
		if (drawEndPos.y < drawStartPos.y) {
			const temp = drawStartPos.y;
			drawStartPos.y = drawEndPos.y;
			drawEndPos.y = temp;
		}
		this.dragContainer.x = drawStartPos.x;
		this.dragContainer.y = drawStartPos.y;
		const selectedClass = getClassFromID(selected);
		selectedClass.renderDrag(this.startPos, this.currPos, this.dragContainer);
	}
	clearRender() {
		this.dragContainer.removeChildren();
	}
	startDrag(ev: MouseEvent) {
		if (this.testing) return;
		if (this.startPos || this.currPos) return;
		this.startPos = getGridPosAtPos(
			new Vec2(ev.x + this.pivot.x, ev.y + this.pivot.y),
		);
		this.currPos = this.startPos;
		this.lastPos = this.startPos;
	}
	updateDrag(ev: MouseEvent) {
		if (this.testing) return;
		if (!this.startPos) return;

		this.currPos = getGridPosAtPos(
			new Vec2(ev.x + this.pivot.x, ev.y + this.pivot.y),
		);
	}
	finishDrag(_ev: MouseEvent) {
		if (this.testing) return;
		if (this.erase) {
			this.reset();
			return;
		}
		if (!this.startPos || !this.currPos) return;

		const w = ((this.currPos.x - this.startPos.x) * Editor.gridSize) / 2;
		const h = ((this.currPos.y - this.startPos.y) * Editor.gridSize) / 2;
		const size = new Vec2(Math.abs(w), Math.abs(h));
		const pos = getPosAtGrid(this.startPos);
		pos.x += w;
		pos.y += h;
		if (this.shouldDrag && (w == 0 || h == 0)) {
			this.currPos = undefined;
			this.startPos = undefined;
			return;
		}
		this.finishedPos = pos;
		this.finishedSize = size;
		this.finishedDragStartPos = this.startPos;
		this.finishedDragEndPos = this.currPos;

		this.currPos = undefined;
		this.startPos = undefined;
	}
	update(
		pivot: Vec2,
		testing: boolean,
		erase: boolean,
		selected?: GameObjectID,
	) {
		this.testing = testing;
		this.pivot = pivot;
		this.shouldDrag = selected ? getClassFromID(selected).draggable : false;
		this.erase = erase;
		if (Actions.click("back")) {
			this.reset();
		}
		this.render(selected);
	}
	reset() {
		this.startPos = undefined;
		this.currPos = undefined;
		this.lastPos = undefined;
		this.finishedSize = undefined;
		this.finishedPos = undefined;
		this.finishedDragStartPos = undefined;
		this.finishedDragEndPos = undefined;
		this.clearRender();
	}
}
