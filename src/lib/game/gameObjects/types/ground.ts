import { World } from "@lib/game/world";
import { PhysicsObject, PhysicsObjectOptions } from "./physicsObject";
import { Graphics } from "pixi.js";
import { PolygonShape } from "planck-js/lib/shape";
import { planckToPixiPos } from "@lib/math/units";
import { Vec2 } from "planck-js";

export class Ground extends PhysicsObject {
	constructor(opt: PhysicsObjectOptions) {
		super(opt);
		this.shape = opt.shape;
	}
	create(world: World): void {
		this.body = world.p.createBody({
			position: this.initPos,
			fixedRotation: this.fixedRotation,
			type: this.bodyType,
		});

		this.body.createFixture({
			density: this.density,
			shape: this.shape,
			friction: this.friction,
			filterCategoryBits: 10,
		});
		const shape = this.shape as PolygonShape;

		const pos = planckToPixiPos(this.body.getPosition());
		const w = Math.abs(shape.m_vertices[2].x) + Math.abs(shape.m_vertices[0].x);
		const h = Math.abs(shape.m_vertices[0].y) + Math.abs(shape.m_vertices[1].y);
		const size = planckToPixiPos(new Vec2(w, h));
		const graphics = new Graphics()
			.rect(pos.x - size.x / 2, pos.y - size.y / 2, size.x, size.y)
			.fill({ color: "black" });

		world.main.addChild(graphics);
	}
}
