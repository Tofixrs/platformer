import {
	Assets,
	autoDetectRenderer,
	Container,
	Graphics as Draw,
	Renderer,
	Text,
} from "pixi.js";
import { CircleShape, PolygonShape } from "planck-js/lib/shape";
import { World } from "../world";
import { Body, Vec2 } from "planck-js";
import { rotate } from "@lib/math/rotateVec2";
import { planckToPixi } from "@lib/math/units";
import { Game } from "game";

export class Graphics<R extends Renderer = Renderer> {
	debugDraw = new Draw();
	stage = new Container();
	renderer!: R;
	fpsElem: Text = new Text({ text: "0" });

	async preload() {
		await Assets.load([
			{ alias: "ground_pin", src: "./assets/ground_pin.png" },
		]);
		await Assets.load("./assets/entities/char/meta.json");
		await Assets.load("./assets/entities/goomba/meta.json");
		await Assets.load("./assets/entities/koopa/meta.json");
		await Assets.load("./assets/ground/grass.json");
		await Assets.load("./assets/ui/meta.json");
	}
	async setup() {
		this.renderer = (await autoDetectRenderer({ background: "white" })) as R;

		globalThis.addEventListener("resize", () => {
			this.resize();
		});
		this.resize();
		this.fpsElem.label = "fpsElem";
		this.fpsElem.visible = false;
		this.stage.addChild(this.fpsElem);

		document.getElementById("app")?.appendChild(this.renderer.canvas);
	}
	public render() {
		this.fpsElem.visible = Game.debug;
		this.renderer.render({ container: this.stage });
	}
	public resize() {
		this.renderer.resize(globalThis.innerWidth, globalThis.innerHeight);
	}
	debugRender(world: World, dt: number) {
		this.fpsElem.text = Math.floor(1 / dt);
		this.debugDraw.clear();

		for (let body = world.p.getBodyList(); body; body = body?.getNext()) {
			this.debugDraw.setStrokeStyle({
				color: body.getType() == "dynamic" ? 0x0000ff : 0x00ff00,
				width: 3,
			});
			for (
				let fixture = body.getFixtureList();
				fixture;
				fixture = fixture.getNext()
			) {
				switch (fixture.getType()) {
					case "polygon": {
						this.renderPolyglon(fixture.getShape() as PolygonShape, body);
						break;
					}
					case "circle": {
						break;
					}
				}
				this.debugDraw.stroke();
			}
		}
	}
	renderCircle(shape: CircleShape, body: Body) {
		const pos = planckToPixi(body.getPosition());
		this.debugDraw.circle(pos.x, pos.y, shape.m_radius);
	}
	renderPolyglon(shape: PolygonShape, body: Body) {
		const pivot = planckToPixi(
			new Vec2(body.getPosition().x, body.getPosition().y),
		);

		const startPos = planckToPixi(
			new Vec2(shape.m_vertices[0].x, shape.m_vertices[0].y),
		);
		const rotatedPos = rotate(startPos, pivot, body.getAngle());
		this.debugDraw.moveTo(rotatedPos.x, rotatedPos.y);
		for (const vert of shape.m_vertices) {
			const point = planckToPixi(new Vec2(vert.x, vert.y));
			const rotatedPoint = rotate(point, pivot, body.getAngle());
			this.debugDraw.lineTo(rotatedPoint.x, rotatedPoint.y);
		}
		this.debugDraw.lineTo(rotatedPos.x, rotatedPos.y);
	}
}
