import { pixiToPlanck, pixiToPlanck1D, planckToPixi } from "@lib/math/units";
import { getGridPosAtPos, getPosAtGrid } from "@worlds/editor";
import { GameObject, GOID, Property, PropertyValue } from "gameObject";
import { PhysicsObject, PhysObjUserData } from "gameObject/types/physicsObject";
import { Container, Texture, TilingSprite } from "pixi.js";
import { Box, Shape, Vec2 } from "planck-js";
import { PolygonShape } from "planck-js/lib/shape";
import { World } from "world";

export class Spike extends PhysicsObject {
	instakill: boolean;
	cont = new Container();
	static draggable = true;
	static props: Property[] = [
		{
			type: "boolean",
			name: "instakill",
			defaultValue: "false",
		},
	];
	static instakillTexture = "spike_instakill";
	static normalTexture = "spike_normal";
	constructor(pos: Vec2, shape: Shape, instakill: boolean = false) {
		super({
			pos,
			shape,
			density: 0,
			friction: 0.75,
			goid: GOID.Spike,
			fixedRotation: true,
			bodyType: "static",
		});
		this.instakill = instakill;
	}
	static commonConstructor(
		pos: Vec2,
		_shape: Shape,
		startPos: Vec2,
		currPos: Vec2,
		props?: PropertyValue[],
	): GameObject {
		const drawStartPos = getPosAtGrid(startPos);
		const drawEndPos = getPosAtGrid(currPos);

		const dragWidth = drawEndPos.x - drawStartPos.x;
		const dragHeight = drawEndPos.y - drawStartPos.y;

		pos.x += pixiToPlanck1D(dragWidth % 32) / 2;
		pos.y += pixiToPlanck1D(dragHeight % 32) / 2;

		const w = Math.ceil(Math.abs(dragWidth) / 32) * 16;
		const h = Math.ceil(Math.abs(dragHeight) / 32) * 16;
		const size = pixiToPlanck(new Vec2(w, h));

		const instakill = props?.find((v) => v.name == "instakill")?.value;
		return new Spike(
			pos,
			new Box(size.x, size.y),
			instakill == "1" || instakill == "true",
		);
	}
	static renderDrag(
		startPos: Vec2,
		currPos: Vec2,
		container: Container,
		instakill: boolean = false,
	): void {
		const drawStartPos = getPosAtGrid(startPos);
		const drawEndPos = getPosAtGrid(currPos);

		const w = Math.ceil(Math.abs(drawEndPos.x - drawStartPos.x) / 32) * 32;
		const h = Math.ceil(Math.abs(drawEndPos.y - drawStartPos.y) / 32) * 32;
		const size = new Vec2(w, h);

		const spr = new TilingSprite({
			texture: Texture.from(
				instakill ? Spike.instakillTexture : Spike.normalTexture,
			),
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
	update(dt: number, world: World): void {
		super.update(dt, world);
	}
	remove(world: World, _force?: boolean): boolean {
		super.remove(world, _force);
		world.main.removeChild(this.cont);
		return true;
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
		Spike.renderDrag(gridPos, gridEndPos, this.cont, this.instakill);

		world.main.addChild(this.cont);
		world.p.on("begin-contact", (contact) => {
			const fixA = contact.getFixtureA();
			const fixB = contact.getFixtureB();
			const userA = fixA.getUserData() as PhysObjUserData;
			const userB = fixB.getUserData() as PhysObjUserData;
			if (userA == null || userB == null) return;
			if (userA.id != this.id && userB.id != this.id) return;
			if (userA.goid != GOID.Player && userB.goid != GOID.Player) return;
			const player = userA.goid == GOID.Player ? userA : userB;
			world.removeEntity(player.id, this.instakill);
		});
	}
}
