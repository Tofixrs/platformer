import { meter } from "@lib/math/units";
import { SerializedGO } from "@lib/serialize";
import { getPosAtGrid } from "@worlds/editor";
import {
	GameObject,
	GOID,
	Property,
	PropertyValue,
	PropType,
} from "gameObject";
import { Ground, GroundAtlas } from "gameObject/types/ground";
import { Container, Texture, TilingSprite } from "pixi.js";
import { Box, Fixture, Polygon, PolygonShape, Shape, Vec2 } from "planck";
import { Player } from "./player";
import { World } from "world";
import { PhysObjUserData } from "gameObject/types/physicsObject";
import { Actions } from "@lib/input";

export class Pipe extends Ground {
	static atlas: GroundAtlas = {
		corner: "rock",
		corner_both: "rock",
		side: "rock",
		one_block: "rock",
		center: "rock",
		side_both: "rock",
	};
	rotation: number;
	player?: Player;
	playerSensor!: Fixture;
	exitPipe?: Pipe;
	exit?: string;
	checkedPipe = false;
	waitUntilNextEntry = false;
	static props: Property[] = [
		{
			name: "exit",
			type: PropType.string,
			defaultValue: "",
		},
	];
	constructor(pos: Vec2, shape: Shape, rotation: number, exit?: string) {
		super({
			pos,
			friction: 0.75,
			shape,
			goid: GOID.Pipe,
		});
		this.rotation = rotation;
		this.exit = exit;
	}
	update(_dt: number, world: World): void {
		super.update(_dt, world);
		if (!this.exit) return;
		if (!this.checkedPipe) {
			const pipe = world.entities.find(
				(v) => v instanceof Pipe && v.exit == this.exit && v.id != this.id,
			);
			this.exitPipe = pipe as Pipe;
			this.checkedPipe = true;
		}
		if (!this.exitPipe) return;
		if (!this.player) return;
		if (this.waitUntilNextEntry && !Actions.hold("crouch")) {
			this.waitUntilNextEntry = false;
		}
		if (this.waitUntilNextEntry) return;
		if (!Actions.hold("crouch")) return;

		const exitPipePos = this.exitPipe.pos.clone();
		const s = this.exitPipe.shape as PolygonShape;
		const w = Math.abs(s.m_vertices[3].x - s.m_vertices[0].x);
		const h = Math.abs(s.m_vertices[3].y - s.m_vertices[1].y);

		const offset = {
			true: () => new Vec2(this.exitPipe!.rotation == 1 ? w / 2 : -(w / 2), 0),
			false: () => new Vec2(0, this.exitPipe!.rotation == 2 ? h / 2 : -(h / 2)),
		}[String(this.exitPipe.rotation == 1 || this.exitPipe.rotation == 3)]!();
		exitPipePos.x += offset.x;
		exitPipePos.y += offset.y;
		this.exitPipe.waitUntilNextEntry = true;
		this.player.body.setPosition(exitPipePos);
	}
	static renderDrag(startPos: Vec2, currPos: Vec2, container: Container): void {
		const drawStartPos = getPosAtGrid(startPos);
		const drawEndPos = getPosAtGrid(currPos);

		const w = Math.ceil(Math.abs(drawEndPos.x - drawStartPos.x) / 32) * 32;
		const h = Math.ceil(Math.abs(drawEndPos.y - drawStartPos.y) / 32) * 32;
		const wR = h > w ? 1 * meter : w;
		const hR = h > w ? h : 1 * meter;
		const size = new Vec2(wR, hR);

		const spr = new TilingSprite({
			tileScale: { x: 2, y: 2 },
			texture: Texture.from("rock"),
			width: size.x,
			height: size.y,
		});
		if (drawEndPos.x - drawStartPos.x < 0) {
			container.x = h > w ? drawStartPos.x - 1 * meter : drawStartPos.x - w;
		}
		if (drawEndPos.y - drawStartPos.y < 0) {
			container.y = w > h ? drawStartPos.y - 1 * meter : drawStartPos.y - h;
		}
		container.addChild(spr);
	}
	create(world: World): void {
		super.create(world);
		const s = this.shape as PolygonShape;
		const w = Math.abs(s.m_vertices[3].x - s.m_vertices[0].x);
		const h = Math.abs(s.m_vertices[3].y - s.m_vertices[1].y);

		const offset = {
			true: () => new Vec2(this.rotation == 1 ? w / 2 : -(w / 2), 0),
			false: () => new Vec2(0, this.rotation == 2 ? h / 2 : -(h / 2)),
		}[String(this.rotation == 1 || this.rotation == 3)]!();

		this.playerSensor = this.body.createFixture({
			isSensor: true,
			shape: new Box(0.45, 0.25, offset, this.rotation * (Math.PI / 2)),
		});
		world.p.on("begin-contact", (contact) => {
			const fixA = contact.getFixtureA();
			const fixB = contact.getFixtureB();
			if (fixA != this.playerSensor && fixB != this.playerSensor) return;
			const userA = fixA.getUserData() as PhysObjUserData;
			const userB = fixB.getUserData() as PhysObjUserData;
			if (!userA && !userB) return;
			if (userA?.goid != GOID.Player && userB?.goid != GOID.Player) return;
			const other = userA?.goid == GOID.Player ? userA : userB;

			this.player = world.entities.find((v) => other.id == v.id) as Player;
		});
		world.p.on("end-contact", (contact) => {
			const fixA = contact.getFixtureA();
			const fixB = contact.getFixtureB();
			if (fixA != this.playerSensor && fixB != this.playerSensor) return;
			const userA = fixA.getUserData() as PhysObjUserData;
			const userB = fixB.getUserData() as PhysObjUserData;
			if (!userA && !userB) return;
			if (userA?.goid != GOID.Player && userB?.goid != GOID.Player) return;

			this.player = undefined;
		});
	}
	static commonConstructor(
		pos: Vec2,
		shape: Shape,
		startPos: Vec2,
		currPos: Vec2,
		props?: PropertyValue[],
	): GameObject {
		const s = shape as PolygonShape;
		const w = Math.abs(s.m_vertices[3].x - s.m_vertices[0].x);
		const h = Math.abs(s.m_vertices[3].y - s.m_vertices[1].y);
		const wA = w + (w % 0.5);
		const hA = h + (h % 0.5);
		const wR = h > w ? 1 : wA;
		const hR = h > w ? hA : 1;
		let rotation = w > h ? 1 : 2;
		if (startPos.x > currPos.x) {
			pos.x -= (w % 0.5) / 2;
			rotation = 3;
		} else {
			pos.x += (w % 0.5) / 2;
		}
		if (startPos.y > currPos.y) {
			pos.y -= (h % 0.5) / 2;
			rotation = 0;
		} else {
			pos.y += (h % 0.5) / 2;
		}
		if (h > w) {
			pos.x -= startPos.x > currPos.x ? -(wA / 2 - 0.5) : wA / 2 - 0.5;
		} else {
			pos.y -= startPos.y > currPos.y ? -(hA / 2 - 0.5) : hA / 2 - 0.5;
		}

		const exit = props?.find((v) => v.name == "exit");
		return new Pipe(pos, new Box(wR / 2, hR / 2), rotation, exit?.value);
	}
	serialize(): SerializedGO {
		return {
			_type: this.goid,
			data: {
				pos: this.pos,
				shapeVerts: (this.shape as PolygonShape).m_vertices,
				rotation: this.rotation,
				exit: this.exit,
			},
		};
	}
	static deserialize(obj: SerializedGO): GameObject {
		const verts = obj.data.shapeVerts.map((v: any) => new Vec2(v.x, v.y));
		const shape = new Polygon(verts);
		return new Pipe(
			new Vec2(obj.data.pos.x, obj.data.pos.y),
			shape,
			obj.data.rotation,
			obj.data.exit,
		);
	}
}
