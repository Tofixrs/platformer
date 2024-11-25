import { SerializedGO } from "@lib/serialize";
import { getPosAtGrid } from "@worlds/editor";
import { GameObject, GOID, PropertyValue } from "gameObject";
import { Ground, GroundAtlas } from "gameObject/types/ground";
import { Container, Texture, TilingSprite } from "pixi.js";
import { Box, Polygon, Shape, Vec2 } from "planck-js";

export class Rock extends Ground {
	static atlas: GroundAtlas = {
		corner: "rock",
		corner_both: "rock",
		side: "rock",
		one_block: "rock",
		center: "rock",
		side_both: "rock",
	};
	constructor(pos: Vec2, shape: Shape) {
		super({
			pos,
			friction: 0.75,
			shape,
			goid: GOID.Rock,
		});
	}
	static renderDrag(startPos: Vec2, currPos: Vec2, container: Container): void {
		const drawStartPos = getPosAtGrid(startPos);
		const drawEndPos = getPosAtGrid(currPos);

		const w = Math.ceil(Math.abs(drawEndPos.x - drawStartPos.x) / 32) * 32;
		const h = Math.ceil(Math.abs(drawEndPos.y - drawStartPos.y) / 32) * 32;
		const size = new Vec2(w, h);

		const spr = new TilingSprite({
			tileScale: { x: 2, y: 2 },
			texture: Texture.from("rock"),
			width: size.x,
			height: size.y,
		});
		if (drawEndPos.x - drawStartPos.x < 0) {
			container.x = drawStartPos.x - w;
		}
		if (drawEndPos.y - drawStartPos.y < 0) {
			container.y = drawStartPos.y - h;
		}
		container.addChild(spr);
	}
	static commonConstructor(
		pos: Vec2,
		shape: Shape,
		_startPos: Vec2,
		_currPos: Vec2,
		_props?: PropertyValue[],
	): GameObject {
		const s = shape as Polygon;
		const w = Math.abs(s.m_vertices[3].x - s.m_vertices[0].x);
		const h = Math.abs(s.m_vertices[3].y - s.m_vertices[1].y);
		const wA = w + (w % 0.5);
		const hA = h + (h % 0.5);
		if (_currPos.x - _startPos.x < 0) {
			pos.x -= (w % 0.5) / 2;
		} else {
			pos.x += (w % 0.5) / 2;
		}
		if (_currPos.y - _startPos.y < 0) {
			pos.y -= (h % 0.5) / 2;
		} else {
			pos.y += (h % 0.5) / 2;
		}
		return new Rock(pos, new Box(wA / 2, hA / 2));
	}
	static deserialize(obj: SerializedGO): GameObject {
		const verts = obj.data.shapeVerts.map((v: any) => new Vec2(v.x, v.y));
		const shape = new Polygon(verts);
		return new Rock(new Vec2(obj.data.pos.x, obj.data.pos.y), shape);
	}
}
