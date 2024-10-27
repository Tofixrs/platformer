import { Sprite, Graphics as Draw } from "pixi.js";
import { Vec2 } from "planck-js";
import { Editor, getGridPosAtPos, getPosAtGrid } from ".";
import { Actions } from "@lib/input";

export class MouseHandler {
	fakeSprtie?: Sprite;
	dragDraw = new Draw();
	startPos?: Vec2;
	currPos?: Vec2;
	lastPos?: Vec2;
	finishedPos?: Vec2;
	finishedSize?: Vec2;
	pivot: Vec2;
	shouldDrag = false;
	testing = false;

	constructor(pivot: Vec2) {
		this.pivot = pivot;

		window.addEventListener("mousedown", (ev) => this.startDrag(ev));
		window.addEventListener("mousemove", (ev) => this.updateDrag(ev));
		window.addEventListener("mouseup", () => {
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
				this.dragDraw.clear();
				return;
			}
			this.finishedPos = pos;
			this.finishedSize = size;

			this.currPos = undefined;
			this.startPos = undefined;
			this.dragDraw.clear();
		});
	}

	render() {
		if (this.testing) return;

		if (!this.currPos || !this.startPos || !this.lastPos) return;
		if (this.currPos.x == this.lastPos.x && this.currPos.y == this.lastPos.x)
			return;
		this.lastPos = this.currPos;

		this.lastPos = this.currPos;
		if (!this.shouldDrag) return;

		const drawStartPos = getPosAtGrid(this.startPos);
		const drawEndPos = getPosAtGrid(this.currPos);

		const size = new Vec2(
			drawEndPos.x - drawStartPos.x,
			drawEndPos.y - drawStartPos.y,
		);

		if (size.x < 0) {
			drawStartPos.x = drawEndPos.x;
			size.x = Math.abs(size.x);
		}
		if (size.y < 0) {
			drawStartPos.y = drawEndPos.y;
			size.y = Math.abs(size.y);
		}
		this.dragDraw.clear();

		this.dragDraw.rect(drawStartPos.x, drawStartPos.y, size.x, size.y);
		this.dragDraw.fill({ color: "black" });
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
		this.dragDraw.clear();
	}
}
