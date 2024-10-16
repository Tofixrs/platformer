import { Vec2 } from "planck-js";

export function lerp2D(s: Vec2, e: Vec2, amt: number) {
	const dx = e.x - s.x;
	const dy = e.y - s.y;

	return new Vec2(s.x + dx * amt, s.y + dy * amt);
}

export function lerp(s: number, e: number, amt: number) {
	const d = e - s;

	const lerped = s + d * amt;
	return isNaN(lerped) ? 0 : lerped;
}

export function physicsLerp(s: Vec2, e: Vec2, alpha: number) {
	return new Vec2(
		e.x * alpha + s.x * (1 - alpha),
		e.y * alpha + s.y * (1 - alpha),
	);
}
