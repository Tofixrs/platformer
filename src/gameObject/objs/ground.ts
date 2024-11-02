import { World } from "world";
import { PhysicsObject, PhysicsObjectOptions } from "../types/physicsObject";
import { Container, Sprite, Texture, TilingSprite } from "pixi.js";
import { PolygonShape } from "planck-js/lib/shape";
import { planckToPixi } from "@lib/math/units";
import { Vec2 } from "planck-js";
import { Editor, getGridPosAtPos, getPosAtGrid } from "@worlds/editor";
import { GOID } from "gameObject";

type GroundOpts = Omit<
	PhysicsObjectOptions,
	"fixedRotation" | "density" | "bodyType" | "id"
>;

export class Ground extends PhysicsObject {
	static draggable: boolean = true;
	cont = new Container();
	constructor(opt: GroundOpts) {
		super({
			fixedRotation: true,
			density: 0,
			bodyType: "static",
			id: GOID.Ground,
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
			filterCategoryBits: 10,
			userData: {
				goid: this.id,
				id: window.crypto.randomUUID(),
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
		Ground.renderDrag(gridPos, gridEndPos, this.cont);

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
			const leftCorner = Sprite.from("grass_corner");
			leftCorner.x = size.x;
			leftCorner.scale.x = -1;

			const bottomLeftCorner = Sprite.from("grass_corner");
			bottomLeftCorner.x = size.x;
			bottomLeftCorner.y = size.y;
			bottomLeftCorner.scale.x = -1;
			bottomLeftCorner.scale.y = -1;

			const bottomRightCorner = Sprite.from("grass_corner");
			bottomRightCorner.y = size.y;
			bottomRightCorner.scale.y = -1;

			const center = new TilingSprite({
				texture: Texture.from("grass_center"),
				width: size.x - Editor.gridSize * 2 + 5,
				height: size.y - Editor.gridSize * 2 + 5,
				x: Editor.gridSize,
				y: Editor.gridSize,
			});

			const topSide = new TilingSprite({
				texture: Texture.from("grass_side"),
				x: Editor.gridSize,
				width: size.x - Editor.gridSize * 2,
				height: Editor.gridSize,
			});
			const bottomSide = new TilingSprite({
				texture: Texture.from("grass_side"),
				x: size.x - Editor.gridSize,
				y: size.y,
				width: size.x - Editor.gridSize * 2,
				height: Editor.gridSize,
				angle: -180,
			});

			const leftSide = new TilingSprite({
				texture: Texture.from("grass_side"),
				width: size.y - Editor.gridSize * 2,
				angle: -90,
				y: size.y - Editor.gridSize,
			});
			const rightSide = new TilingSprite({
				texture: Texture.from("grass_side"),
				width: size.y - Editor.gridSize * 2,
				angle: 90,
				x: size.x,
				y: Editor.gridSize,
			});

			container.addChild(
				Sprite.from("grass_corner"),
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
				texture: Texture.from("grass_side_both"),
				y: Editor.gridSize,
				x: Editor.gridSize,
				width: size.y - Editor.gridSize * 2,
				angle: 90,
			});
			const bottomCorner = Sprite.from("grass_corner_both");
			bottomCorner.scale.y = -1;
			bottomCorner.y = size.y;

			container.addChild(Sprite.from("grass_corner_both"), side, bottomCorner);
		} else if (size.y == Editor.gridSize && size.x > Editor.gridSize) {
			const leftSide = Sprite.from("grass_corner_both");
			leftSide.angle = -90;
			leftSide.y = Editor.gridSize;

			const rightSide = Sprite.from("grass_corner_both");
			rightSide.angle = 90;
			rightSide.x = size.x;
			const center = new TilingSprite({
				texture: Texture.from("grass_side_both"),
				width: size.x - Editor.gridSize * 2,
				x: Editor.gridSize,
			});

			container.addChild(leftSide, rightSide, center);
		} else if (size.y == Editor.gridSize && size.x == Editor.gridSize) {
			container.addChild(Sprite.from("grass_one_block"));
		}
	}
	remove(world: World): void {
		super.remove(world);
		world.main.removeChild(this.cont);
	}
}
