import { planckToPixi, planckToPixi1D } from "@lib/math/units";
import { SerializedGO } from "@lib/serialize";
import { getPosAtGrid } from "@worlds/editor";
import {
	GameObject,
	GOID,
	Property,
	PropertyValue,
	PropType,
} from "gameObject";
import { Container, Texture, TilingSprite } from "pixi.js";
import { Body, Polygon, PolygonShape, Shape, Vec2 } from "planck";
import { World } from "world";

export class CameraWall extends GameObject {
	static draggable: boolean = true;
	fakeBody!: Body;
	//so i dont have to calc this all the time i need to check if in bound
	width: number;
	height: number;
	pixiPos: Vec2;
	bottomEdge: number;
	leftEdge: number;
	topEdge: number;
	rightEdge: number;
	vertical: boolean;
	static props: Property[] = [
		{
			type: PropType.boolean,
			name: "verticalCamWall",
			defaultValue: "false",
			descriptionKey: "verticalCamWall",
		},
	];

	constructor(pos: Vec2, shape: Shape, vertical = false) {
		super({
			pos,
			shape,

			goid: GOID.CameraWall,
		});
		const s = shape as PolygonShape;
		this.pixiPos = planckToPixi(this.pos);
		this.width = planckToPixi1D(
			Math.abs(s.m_vertices[3].x - s.m_vertices[0].x),
		);
		this.height = planckToPixi1D(
			Math.abs(s.m_vertices[3].y - s.m_vertices[1].y),
		);
		this.leftEdge = this.pixiPos.x - this.width / 2;
		this.rightEdge = this.pixiPos.x + this.width / 2;
		this.topEdge = this.pixiPos.y - this.height / 2;
		this.bottomEdge = this.pixiPos.y + this.height / 2;
		this.vertical = vertical;
	}
	static commonConstructor(
		pos: Vec2,
		shape: Shape,
		_startPos: Vec2,
		_currPos: Vec2,
		props?: PropertyValue[],
	): GameObject {
		const vertical = props?.find((v) => v.name == "verticalCamWall")?.value;
		return new CameraWall(pos, shape, vertical == "true" || vertical == "1");
	}
	static renderDrag(startPos: Vec2, currPos: Vec2, container: Container): void {
		const drawStartPos = getPosAtGrid(startPos);
		const drawEndPos = getPosAtGrid(currPos);

		const w = drawEndPos.x - drawStartPos.x;
		const h = drawEndPos.y - drawStartPos.y;
		const size = new Vec2(w, h);

		size.x = Math.abs(size.x);
		size.y = Math.abs(size.y);

		const tile = new TilingSprite({
			texture: Texture.from("deathPlane_pin"),
			width: w,
			height: h,
		});
		if (drawEndPos.x < drawStartPos.x) {
			container.x -= w;
		}
		if (drawEndPos.y < drawStartPos.y) {
			container.y -= h;
		}
		container.addChild(tile);
	}
	create(world: World): void {
		this.fakeBody = world.p.createBody({
			position: this.pos,
			type: "static",
		});
		this.fakeBody.createFixture({
			shape: this.shape,
			isSensor: true,
		});
	}
	remove(world: World, _force?: boolean, _anim?: boolean): boolean {
		world.p.queueUpdate((world) => {
			world.destroyBody(this.fakeBody);
		});
		return true;
	}
	serialize(): SerializedGO {
		return {
			_type: this.goid,
			data: {
				pos: this.pos,
				shapeVerts: (this.shape as PolygonShape).m_vertices,
				vertical: this.vertical,
			},
		};
	}
	static deserialize(obj: SerializedGO): GameObject {
		const pos = new Vec2(obj.data.pos.x, obj.data.pos.y);
		const shape = new Polygon(obj.data.shapeVerts);
		return new CameraWall(pos, shape, obj.data.vertical);
	}
}
