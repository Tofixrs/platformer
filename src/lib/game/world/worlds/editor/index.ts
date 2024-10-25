import { Graphics as Draw, Rectangle, Ticker } from "pixi.js";
import { World } from "../..";
import { Graphics } from "@lib/game/graphics";
import { Box, Vec2 } from "planck-js";
import { Ground } from "@lib/game/gameObjects/types/ground";
import { pixiToPlanckPos } from "@lib/math/units";
import { Actions } from "input";

export class Editor extends World {
	gridDraw = new Draw();
	screen: Rectangle = new Rectangle(0, 0);
	gridSize = 24;
	startDragPos?: Vec2;
	currDragPos?: Vec2;
	lastDragPos?: Vec2;
	drag = new Draw();
	lastPivot: Vec2;
	didDrawOnece = false;
	lastTime = 0;
	moveSpeed = 500;
	constructor(graphics: Graphics) {
		super(graphics);
		this.main.x = 0;
		this.main.y = 0;
		this.lastPivot = new Vec2(this.main.pivot.x, this.main.pivot.y);

		this.recenter(graphics.renderer.screen);
		this.main.addChild(this.gridDraw);
		this.main.addChild(this.drag);

		window.addEventListener("mousedown", (ev) => {
			if (this.startDragPos || this.currDragPos) return;
			this.startDragPos = this.getGridPosAtPos(
				new Vec2(ev.x + this.main.pivot.x, ev.y + this.main.pivot.y),
			);
			this.currDragPos = this.startDragPos;
			this.lastDragPos = this.startDragPos;
		});
		window.addEventListener("mousemove", (ev) => {
			if (this.startDragPos) {
				this.currDragPos = this.getGridPosAtPos(
					new Vec2(ev.x + this.main.pivot.x, ev.y + this.main.pivot.y),
				);
			}
		});
		window.addEventListener("mouseup", (ev) => {
			if (!this.startDragPos || !this.currDragPos) return;

			const w = (this.currDragPos.x - this.startDragPos.x) * this.gridSize;
			const h = (this.currDragPos.y - this.startDragPos.y) * this.gridSize;
			const physicsSize = pixiToPlanckPos(new Vec2(w, h));
			const physicsPos = pixiToPlanckPos(this.getPosAtGrid(this.startDragPos));

			if (physicsSize.x == 0 || physicsSize.y == 0) {
				this.currDragPos = undefined;
				this.startDragPos = undefined;
				this.drag.clear();
				return;
			}
			physicsSize.x /= 2;
			physicsSize.y /= 2;
			physicsPos.x += physicsSize.x;
			physicsPos.y += physicsSize.y;
			const ground = new Ground({
				friction: 10,
				shape: new Box(physicsSize.x, physicsSize.y),
				initPos: physicsPos,
				density: 20,
				bodyType: "static",
				fixedRotation: true,
			});
			ground.create(this);
			this.currDragPos = undefined;
			this.startDragPos = undefined;
			this.drag.clear();
		});
	}
	update(ticker: Ticker): void {
		this.drawGrid();
		if (Actions.click("back") && this.startDragPos) {
			this.startDragPos = undefined;
			this.currDragPos = undefined;
			this.lastDragPos = undefined;
			this.drag.clear();
		}
		if (
			this.startDragPos &&
			this.currDragPos &&
			(this.currDragPos.x != this.lastDragPos!.x ||
				this.currDragPos.y != this.lastDragPos!.y)
		) {
			const drawStartPos = this.getPosAtGrid(this.startDragPos);
			const drawEndPos = this.getPosAtGrid(this.currDragPos);
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
			this.drag.clear();

			this.drag.rect(drawStartPos.x, drawStartPos.y, size.x, size.y);
			this.drag.fill({ color: "black" });
		}
		this.lastPivot = new Vec2(this.main.pivot.x, this.main.pivot.y);
		const currMoveSpeed = this.moveSpeed * (ticker.deltaMS / 1000);
		if (Actions.hold("jump")) {
			this.main.pivot.y -= currMoveSpeed;
		}
		if (Actions.hold("left")) {
			this.main.pivot.x -= currMoveSpeed;
		}
		if (Actions.hold("right")) {
			this.main.pivot.x += currMoveSpeed;
		}
		if (Actions.hold("crouch")) {
			this.main.pivot.y += currMoveSpeed;
		}
	}
	drawGrid() {
		if (this.didDrawOnece) {
			if (
				this.lastPivot.x == this.main.pivot.x &&
				this.lastPivot.y == this.main.pivot.y
			)
				return;
		}
		this.gridDraw.clear();
		const width = Math.ceil(this.screen.width / this.gridSize) + 2;
		const height = Math.ceil(this.screen.height / this.gridSize) + 2;
		const screenOffsetX =
			Math.floor(this.main.pivot.x / this.gridSize) * this.gridSize;
		const screenOffsetY =
			Math.floor(this.main.pivot.y / this.gridSize) * this.gridSize;
		for (let x = -2; x <= width; x++) {
			this.gridDraw.moveTo(
				x * this.gridSize + screenOffsetX,
				-this.screen.height + screenOffsetY - 100,
			);
			this.gridDraw.lineTo(
				x * this.gridSize + screenOffsetX,
				this.screen.height + screenOffsetY + 100,
			);
		}
		for (let y = -2; y <= height; y++) {
			this.gridDraw.moveTo(
				-this.screen.width + screenOffsetX - 100,
				y * this.gridSize + screenOffsetY,
			);
			this.gridDraw.lineTo(
				this.screen.width + screenOffsetX + 100,
				y * this.gridSize + screenOffsetY,
			);
		}
		this.gridDraw.stroke({ color: "black" });
		this.didDrawOnece = true;
	}
	getGridPosAtPos(pos: Vec2) {
		return new Vec2(
			Math.floor(pos.x / this.gridSize),
			Math.floor(pos.y / this.gridSize),
		);
	}
	getPosAtGrid(pos: Vec2) {
		return new Vec2(pos.x * this.gridSize, pos.y * this.gridSize);
	}
	recenter(screen: Rectangle): void {
		this.screen = screen;
		this.didDrawOnece = false;
		this.drawGrid();
	}
}
