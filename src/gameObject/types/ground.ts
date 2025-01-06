import { World } from "world";
import { PhysicsObject, PhysicsObjectOptions } from "../types/physicsObject";
import { Container, Sprite, Texture, TilingSprite } from "pixi.js";
import { PolygonShape, Polygon, Vec2 } from "planck";
import { planckToPixi } from "@lib/math/units";
import { Editor, getGridPosAtPos, getPosAtGrid } from "@worlds/editor";
import { getClassFromID } from "gameObject/utils";
import { SerializedGO } from "@lib/serialize";
import { GameObject } from "gameObject";

export type GroundOpts = Omit<
	PhysicsObjectOptions,
	"fixedRotation" | "density" | "bodyType"
>;
export interface GroundAtlas {
	side: string;
	corner: string;
	corner_both: string;
	center: string;
	side_both: string;
	one_block: string;
}

export class Ground extends PhysicsObject {
	static draggable: boolean = true;
	cont = new Container({ zIndex: -1 });
	static atlas: GroundAtlas = {
		corner: "grass_corner",
		corner_both: "grass_corner_both",
		side: "grass_side",
		one_block: "grass_one_block",
		center: "grass_center",
		side_both: "grass_side_both",
	};
	constructor(opt: GroundOpts) {
		super({
			fixedRotation: true,
			density: 0,
			bodyType: "static",
			...opt,
		});
		this.shape = opt.shape;
	}
	create(world: World): void {
		this.body = world.p.createBody({
			position: this.pos,
			fixedRotation: this.fixedRotation,
			type: this.bodyType,
		});

		this.body.createFixture({
			density: this.density,
			shape: this.shape,
			friction: this.friction,
			filterCategoryBits: 0b01,
			userData: {
				goid: this.goid,
				id: this.id,
			},
		});
		const shape = this.shape as PolygonShape;

		const pos = planckToPixi(this.body.getPosition());
		const w = Math.abs(shape.m_vertices[2].x) + Math.abs(shape.m_vertices[0].x);
		const h = Math.abs(shape.m_vertices[0].y) + Math.abs(shape.m_vertices[1].y);
		const size = planckToPixi(new Vec2(w, h));
		this.cont.x = pos.x - size.x / 2;
		this.cont.y = pos.y - size.y / 2;
		const gridPos = getGridPosAtPos(new Vec2(this.cont.x, this.cont.y));
		const gridEndPos = getGridPosAtPos(
			new Vec2(this.cont.x + size.x, this.cont.y + size.y),
		);
		getClassFromID(this.goid).renderDrag(gridPos, gridEndPos, this.cont);

		world.main.addChild(this.cont);
	}
	static renderDrag(startPos: Vec2, currPos: Vec2, container: Container): void {
		const drawStartPos = getPosAtGrid(startPos);
		const drawEndPos = getPosAtGrid(currPos);

		const w = drawEndPos.x - drawStartPos.x;
		const h = drawEndPos.y - drawStartPos.y;
		const size = new Vec2(w, h);

		size.x = Math.abs(size.x);
		size.y = Math.abs(size.y);
		if (size.x > Editor.gridSize && size.y > Editor.gridSize) {
			const leftCorner = Sprite.from(this.atlas.corner);
			leftCorner.x = size.x;
			leftCorner.scale.x = -1;

			const bottomLeftCorner = Sprite.from(this.atlas.corner);
			bottomLeftCorner.x = size.x;
			bottomLeftCorner.y = size.y;
			bottomLeftCorner.scale.x = -1;
			bottomLeftCorner.scale.y = -1;

			const bottomRightCorner = Sprite.from(this.atlas.corner);
			bottomRightCorner.y = size.y;
			bottomRightCorner.scale.y = -1;

			const center = new TilingSprite({
				texture: Texture.from(this.atlas.center),
				width: size.x - Editor.gridSize * 2 + 5,
				height: size.y - Editor.gridSize * 2 + 5,
				x: Editor.gridSize,
				y: Editor.gridSize,
			});

			const topSide = new TilingSprite({
				texture: Texture.from(this.atlas.side),
				x: Editor.gridSize,
				width: size.x - Editor.gridSize * 2,
				height: Editor.gridSize,
			});
			const bottomSide = new TilingSprite({
				texture: Texture.from(this.atlas.side),
				x: size.x - Editor.gridSize,
				y: size.y,
				width: size.x - Editor.gridSize * 2,
				height: Editor.gridSize,
				angle: -180,
			});

			const leftSide = new TilingSprite({
				texture: Texture.from(this.atlas.side),
				width: size.y - Editor.gridSize * 2,
				angle: -90,
				y: size.y - Editor.gridSize,
			});
			const rightSide = new TilingSprite({
				texture: Texture.from(this.atlas.side),
				width: size.y - Editor.gridSize * 2,
				angle: 90,
				x: size.x,
				y: Editor.gridSize,
			});

			container.addChild(
				Sprite.from(this.atlas.corner),
				leftCorner,
				bottomLeftCorner,
				bottomRightCorner,
				center,
				topSide,
				bottomSide,
				leftSide,
				rightSide,
			);
		} else if (size.y > Editor.gridSize && size.x == Editor.gridSize) {
			const side = new TilingSprite({
				texture: Texture.from(this.atlas.side_both),
				y: Editor.gridSize,
				x: Editor.gridSize,
				width: size.y - Editor.gridSize * 2,
				angle: 90,
			});
			const bottomCorner = Sprite.from(this.atlas.corner_both);
			bottomCorner.scale.y = -1;
			bottomCorner.y = size.y;

			container.addChild(
				Sprite.from(this.atlas.corner_both),
				side,
				bottomCorner,
			);
		} else if (size.y == Editor.gridSize && size.x > Editor.gridSize) {
			const leftSide = Sprite.from(this.atlas.corner_both);
			leftSide.angle = -90;
			leftSide.y = Editor.gridSize;

			const rightSide = Sprite.from(this.atlas.corner_both);
			rightSide.angle = 90;
			rightSide.x = size.x;
			const center = new TilingSprite({
				texture: Texture.from(this.atlas.side_both),
				width: size.x - Editor.gridSize * 2,
				x: Editor.gridSize,
			});

			container.addChild(leftSide, rightSide, center);
		} else if (size.y == Editor.gridSize && size.x == Editor.gridSize) {
			container.addChild(Sprite.from(this.atlas.one_block));
		}
	}
	remove(world: World): boolean {
		super.remove(world);
		world.main.removeChild(this.cont);
		return true;
	}
	serialize(): SerializedGO {
		return {
			_type: this.goid,
			data: {
				pos: this.pos,
				shapeVerts: (this.shape as PolygonShape).m_vertices,
			},
		};
	}
	static deserialize(obj: SerializedGO): GameObject {
		const verts = obj.data.shapeVerts.map(
			(v: { x: number; y: number }) => new Vec2(v.x, v.y),
		);
		const poly = new Polygon(verts);
		const c = getClassFromID(obj._type);
		return c.commonConstructor(
			new Vec2(obj.data.pos.x, obj.data.pos.y),
			poly,
			Vec2.zero(),
			Vec2.zero(),
		);
	}
}
