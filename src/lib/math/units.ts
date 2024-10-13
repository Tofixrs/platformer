import { Vec2 } from "planck-js";

const meter = 64; // in px;

export function planckToPixiPos(vec2: Vec2) {
	return new Vec2(vec2.x * meter, vec2.y * meter);
}

export function pixiToPlanckPos(vec: Vec2) {
	return new Vec2(vec.x * (1 / meter), vec.y * (1 / meter));
}
