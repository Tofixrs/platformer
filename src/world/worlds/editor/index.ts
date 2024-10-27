import { Rectangle } from "pixi.js";
import { World } from "../..";
import { Graphics } from "graphics";
import { Vec2 } from "planck-js";
import { Actions } from "@lib/input";
import { EditorUi } from "./ui";
import { Grid } from "./grid";
import { ObjectPlacer } from "./objectPlacer";

export class Editor extends World {
	screen: Rectangle = new Rectangle(0, 0);
	static gridSize = 32;
	lastTime = 0;
	moveSpeed = 500;
	testing = false;
	ui: EditorUi = new EditorUi();
	rerender = false;
	grid: Grid;
	objectPlacer: ObjectPlacer = new ObjectPlacer(this);
	constructor(graphics: Graphics) {
		super(graphics);
		this.main.x = 0;
		this.main.y = 0;
		this.grid = new Grid(
			new Vec2(this.main.pivot.x, this.main.pivot.y),
			graphics.renderer.screen,
		);

		this.top.addChild(this.ui);
		this.main.addChild(this.grid.draw);
		this.main.addChild(this.objectPlacer.mouseHandler.dragDraw);
		this.recenter(graphics.renderer.screen);
	}
	update(dt: number): void {
		const pivot = new Vec2(this.main.pivot.x, this.main.pivot.y);
		if (Actions.click("test")) {
			this.setTesting(!this.testing);
		}
		if (this.testing) {
			super.update(dt);
			return;
		}
		this.objectPlacer.update(pivot);
		this.moveViewBox(dt);
		this.objectPlacer.selected = this.ui.selected;
		if (this.rerender) {
			this.grid.render(
				new Vec2(this.main.pivot.x, this.main.pivot.y),
				this.screen,
			);
			this.rerender = false;
		}
	}
	fixedUpdate(): void {
		if (!this.testing) return;
		super.fixedUpdate();
	}
	moveViewBox(dt: number) {
		const currMoveSpeed = this.moveSpeed * dt;
		if (Actions.hold("jump")) {
			this.main.pivot.y -= currMoveSpeed;
			this.rerender = true;
		}
		if (Actions.hold("left")) {
			this.main.pivot.x -= currMoveSpeed;
			this.rerender = true;
		}
		if (Actions.hold("right")) {
			this.main.pivot.x += currMoveSpeed;
			this.rerender = true;
		}
		if (Actions.hold("crouch")) {
			this.main.pivot.y += currMoveSpeed;
			this.rerender = true;
		}
	}
	setTesting(yes: boolean) {
		if (yes) {
			this.grid.draw.clear();
		}
		this.testing = yes;
		this.objectPlacer.testing = yes;
		this.recenter(this.screen);
	}
	recenter(screen: Rectangle): void {
		this.screen = screen;

		if (this.testing) {
			super.recenter(screen);
			return;
		} else {
			this.main.x = 0;
			this.main.y = 0;
			this.main.pivot.set(0, 0);
		}
		this.rerender = true;
		this.ui.resize(screen.width, screen.height);
	}
}

export function getGridPosAtPos(pos: Vec2) {
	return new Vec2(
		Math.floor(pos.x / Editor.gridSize),
		Math.floor(pos.y / Editor.gridSize),
	);
}
export function getPosAtGrid(pos: Vec2) {
	return new Vec2(pos.x * Editor.gridSize, pos.y * Editor.gridSize);
}
