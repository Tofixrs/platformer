import { Application, Assets, Graphics as Draw } from "pixi.js";
import { PolygonShape } from "planck-js/lib/shape";
import { World } from "../world";
import { Vec2 } from "planck-js";
import { rotate } from "@lib/math/rotateVec2";
import { planckToPixiPos } from "@lib/math/units";

export class Graphics {
	debugDraw = new Draw();
	pixi = new Application();

	async preload() {
		await Assets.load("/assets/char/meta.json");
	}
	async setup() {
		await this.pixi.init({ resizeTo: window, backgroundColor: "#fff" });

		document.getElementById("app")?.appendChild(this.pixi.canvas);
	}
	debugRender(world: World) {
		this.debugDraw.clear();

		for (let body = world.p.getBodyList(); body; body = body?.getNext()) {
			for (
				let fixture = body.getFixtureList();
				fixture;
				fixture = fixture.getNext()
			) {
				if (fixture.getType() != "polygon") continue;
				const shape = fixture.getShape() as PolygonShape;
				const pivot = planckToPixiPos(
					new Vec2(body.getPosition().x, body.getPosition().y),
				);

				const startPos = planckToPixiPos(
					new Vec2(shape.m_vertices[0].x, shape.m_vertices[0].y),
				);
				const rotatedPos = rotate(startPos, pivot, body.getAngle());
				this.debugDraw.moveTo(rotatedPos.x, rotatedPos.y);
				for (const vert of shape.m_vertices) {
					const point = planckToPixiPos(new Vec2(vert.x, vert.y));
					const rotatedPoint = rotate(point, pivot, body.getAngle());
					this.debugDraw.lineTo(rotatedPoint.x, rotatedPoint.y);
				}
				this.debugDraw.lineTo(rotatedPos.x, rotatedPos.y);
				this.debugDraw.stroke({ color: 0x0000ff, width: 3 });
			}
		}
	}
}
