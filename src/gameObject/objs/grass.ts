import { GOID } from "gameObject";
import { Ground, GroundAtlas } from "gameObject/types/ground";
import { Shape, Vec2 } from "planck-js";

export class Grass extends Ground {
	static atlas: GroundAtlas = {
		corner: "grass_corner",
		corner_both: "grass_corner_both",
		side: "grass_side",
		one_block: "grass_one_block",
		center: "grass_center",
		side_both: "grass_side_both",
	};
	constructor(pos: Vec2, shape: Shape) {
		super({
			pos,
			friction: 0.75,
			shape,
			goid: GOID.Grass,
		});
	}
}
