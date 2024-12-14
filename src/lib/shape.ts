import { PolygonShape, Polygon, Vec2 } from "planck";
import { rotate } from "./math/rotateVec2";

export function capsule(
	size: Vec2,
	offset?: Vec2,
	angle?: number,
): PolygonShape {
	const verts = [
		new Vec2(-size.x / 2, -size.y + size.y / 10),
		new Vec2(0, -size.y),
		new Vec2(size.x / 2, -size.y + size.y / 10),
		new Vec2(size.x, -size.y / 2),
		new Vec2(size.x, 0),
		new Vec2(size.x, size.y / 2),
		new Vec2(size.x / 2, size.y - size.y / 10),
		new Vec2(0, size.y),
		new Vec2(-size.x / 2, size.y - size.y / 10),
		new Vec2(-size.x, size.y / 2),
		new Vec2(-size.x, 0),
		new Vec2(-size.x, -size.y / 2),
	];
	return new Polygon(
		verts
			.map((v) => {
				v.x += offset?.x || 0;
				v.y += offset?.y || 0;
				return v;
			})
			.map((v) => {
				if (!angle) return v;
				return rotate(v, Vec2.zero(), angle);
			}),
	);
}
