import { Vec2 } from "planck-js";

export const meter = 64; // in px;

export function planckToPixi(vec2: Vec2) {
	return new Vec2(vec2.x * meter, vec2.y * meter);
}
export function planckToPixi1D(v: number) {
	return v * meter;
}

export function pixiToPlanck(vec: Vec2) {
	return new Vec2(vec.x / meter, vec.y / meter);
}
export function pixiToPlanck1D(v: number) {
	return v / meter;
}
