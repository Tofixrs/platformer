import { GOID } from "gameObject";
import { Ground, GroundAtlas } from "gameObject/types/ground";
import { Shape, Vec2 } from "planck-js";

export class Ice extends Ground {
	static atlas: GroundAtlas = {
		corner: "ice",
		corner_both: "ice",
		side: "ice",
		one_block: "ice",
		center: "ice",
		side_both: "ice",
	};
	constructor(pos: Vec2, shape: Shape) {
		super({
			pos,
			friction: 0.001,
			shape,
			goid: GOID.Ice,
		});
	}
}
