import { Sprite, Container } from "pixi.js";
import { Vec2 } from "planck-js";
import { Editor, getGridPosAtPos, getPosAtGrid } from ".";
import { Actions } from "@lib/input";
import { GameObject } from "gameObject";

export class MouseHandler {
	fakeSprtie?: Sprite;
	dragContainer = new Container();
	startPos?: Vec2;
	currPos?: Vec2;
	lastPos?: Vec2;
	finishedPos?: Vec2;
	finishedSize?: Vec2;
	pivot: Vec2;
	shouldDrag = false;
	testing = false;
	selectedClass?: typeof GameObject;

	constructor(pivot: Vec2) {
		this.pivot = pivot;

		window.addEventListener("pointerdown", (ev) => this.startDrag(ev));
		window.addEventListener("pointermove", (ev) => this.updateDrag(ev));
		window.addEventListener("pointerup", () => {
			if (this.testing) return;
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

			this.currPos = undefined;
			this.startPos = undefined;
		});
	}

	render() {
		if (this.testing) return;

		if (!this.currPos || !this.startPos || !this.lastPos) return;
		if (this.currPos.x == this.lastPos.x && this.currPos.y == this.lastPos.x)
			return;
		this.lastPos = this.currPos;
		if (!this.shouldDrag) return;

		const drawStartPos = getPosAtGrid(this.startPos);
		const drawEndPos = getPosAtGrid(this.currPos);

		this.clearRender();
		if (drawEndPos.x < drawStartPos.x) {
			drawStartPos.x = drawEndPos.x;
		}
		if (drawEndPos.y < drawStartPos.y) {
			drawStartPos.y = drawEndPos.y;
		}
		this.dragContainer.x = drawStartPos.x;
		this.dragContainer.y = drawStartPos.y;
		this.selectedClass?.renderDrag(
			this.startPos,
			this.currPos,
			this.dragContainer,
		);
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
	update(pivot: Vec2) {
		this.pivot = pivot;
		if (Actions.click("back")) {
			this.reset();
		}
		this.render();
	}
	reset() {
		this.startPos = undefined;
		this.currPos = undefined;
		this.lastPos = undefined;
		this.finishedSize = undefined;
		this.finishedPos = undefined;
		this.clearRender();
	}
}
