import { World } from "world";
import { PhysicsObject, PhysicsObjectOptions } from "../types/physicsObject";
import { Container, Sprite } from "pixi.js";
import { PolygonShape } from "planck-js/lib/shape";
import { planckToPixi } from "@lib/math/units";
import { Vec2 } from "planck-js";
import { Editor, getGridPosAtPos, getPosAtGrid } from "@worlds/editor";

export class Ground extends PhysicsObject {
	static draggable: boolean = true;
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

		const pos = planckToPixi(this.body.getPosition());
		const w = Math.abs(shape.m_vertices[2].x) + Math.abs(shape.m_vertices[0].x);
		const h = Math.abs(shape.m_vertices[0].y) + Math.abs(shape.m_vertices[1].y);
		const size = planckToPixi(new Vec2(w, h));
		const cont = new Container();
		cont.x = pos.x - size.x / 2;
		cont.y = pos.y - size.y / 2;
		const gridPos = getGridPosAtPos(new Vec2(cont.x, cont.y));
		const gridEndPos = getGridPosAtPos(
			new Vec2(cont.x + size.x, cont.y + size.y),
		);
		Ground.renderDrag(gridPos, gridEndPos, cont);

		world.main.addChild(cont);
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

			const center = Sprite.from("grass_center");
			center.x = Editor.gridSize;
			center.y = Editor.gridSize;
			center.width = size.x - Editor.gridSize * 2;
			center.height = size.y - Editor.gridSize * 2;

			const topSide = Sprite.from("grass_side");
			topSide.x = Editor.gridSize;
			topSide.width = size.x - Editor.gridSize * 2;

			const bottomSide = Sprite.from("grass_side");
			bottomSide.x = size.x - Editor.gridSize;
			bottomSide.y = size.y;
			bottomSide.width = size.x - Editor.gridSize * 2;
			bottomSide.angle = -180;
			const leftSide = Sprite.from("grass_side");
			leftSide.width = size.y - Editor.gridSize * 2;
			leftSide.angle = -90;
			leftSide.y = size.y - Editor.gridSize;
			const rightSide = Sprite.from("grass_side");
			rightSide.width = size.y - Editor.gridSize * 2;
			rightSide.angle = 90;
			rightSide.x = size.x;
			rightSide.y = Editor.gridSize;

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
			const side = Sprite.from("grass_side_both");
			side.y = Editor.gridSize;
			side.x = Editor.gridSize;
			side.width = size.y - Editor.gridSize * 2;
			side.angle = 90;
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
			const center = Sprite.from("grass_side_both");
			center.x = Editor.gridSize;
			center.width = size.x - Editor.gridSize * 2;

			container.addChild(leftSide, rightSide, center);
		} else if (size.y == Editor.gridSize && size.x == Editor.gridSize) {
			container.addChild(Sprite.from("grass_one_block"));
		}
	}
}
