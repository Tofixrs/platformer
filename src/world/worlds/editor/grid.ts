import { Vec2 } from "planck";
import { Graphics as Draw, Rectangle } from "pixi.js";
import { Editor } from ".";

export class Grid {
	draw = new Draw({ zIndex: -3 });
	constructor(pivot: Vec2, screen: Rectangle) {
		this.render(pivot, screen);
	}
	render(pivot: Vec2, screen: Rectangle) {
		this.draw.clear();
		const width = Math.ceil(screen.width / Editor.gridSize) + 2;
		const height = Math.ceil(screen.height / Editor.gridSize) + 2;
		const screenOffsetX =
			Math.floor(pivot.x / Editor.gridSize) * Editor.gridSize;
		const screenOffsetY =
			Math.floor(pivot.y / Editor.gridSize) * Editor.gridSize;
		for (let x = -2; x <= width; x++) {
			this.draw.moveTo(
				x * Editor.gridSize + screenOffsetX,
				-screen.height + screenOffsetY - 100,
			);
			this.draw.lineTo(
				x * Editor.gridSize + screenOffsetX,
				screen.height + screenOffsetY + 100,
			);
		}
		for (let y = -2; y <= height; y++) {
			this.draw.moveTo(
				-screen.width + screenOffsetX - 100,
				y * Editor.gridSize + screenOffsetY,
			);
			this.draw.lineTo(
				screen.width + screenOffsetX + 100,
				y * Editor.gridSize + screenOffsetY,
			);
		}
		this.draw.stroke({ color: "black" });
	}
}
