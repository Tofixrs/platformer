import { Application, Assets, Graphics as Draw } from "pixi.js";
import { Body } from "planck-js";
import { PolygonShape } from "planck-js/lib/shape";
import { World } from "../world";

export class Graphics {
	debugDraw = new Draw();
	pixi = new Application();

	async preload() {
		const assets = [{ alias: "player", src: "/char.png" }];
		await Assets.load(assets);
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

				this.debugDraw.setStrokeStyle({ color: 0x0000ff, width: 3 });
				this.debugDraw.moveTo(
					(shape.m_vertices[0].x + body.getPosition().x) * 64,
					(shape.m_vertices[0].y + body.getPosition().y) * 64,
				);
				for (const vert of shape.m_vertices) {
					this.debugDraw.lineTo(
						(vert.x + body.getPosition().x) * 64,
						(vert.y + body.getPosition().y) * 64,
					);
				}
				this.debugDraw.lineTo(
					(shape.m_vertices[0].x + body.getPosition().x) * 64,
					(shape.m_vertices[0].y + body.getPosition().y) * 64,
				);
				this.debugDraw.stroke();
			}
		}
	}
}
