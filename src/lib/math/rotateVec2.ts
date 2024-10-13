import { Vec2 } from "planck-js";

export function rotate(point: Vec2, pivot: Vec2, angle: number) {
	return new Vec2(
		point.x * Math.cos(angle) - point.y * Math.sin(angle) + pivot.x,
		point.x * Math.sin(angle) + point.y * Math.cos(angle) + pivot.y,
	);
}
