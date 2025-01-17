import { meter, planckToPixi, planckToPixi1D } from "@lib/math/units";
import { SerializedGO } from "@lib/serialize";
import { Editor, getGridPosAtPos, getPosAtGrid } from "@worlds/editor";
import {
	GameObject,
	GOID,
	Property,
	PropertyValue,
	PropType,
} from "gameObject";
import { Ground, GroundAtlas } from "gameObject/types/ground";
import { Container, Sprite, Texture, TilingSprite } from "pixi.js";
import { Box, Fixture, Polygon, PolygonShape, Shape, Vec2 } from "planck";
import { Player, PowerState } from "./player";
import { World } from "world";
import { PhysObjUserData } from "gameObject/types/physicsObject";
import { Actions } from "@lib/input";
import { Paralax } from "./paralax";

export class Pipe extends Ground {
	static atlas: GroundAtlas = {
		corner: "",
		corner_both: "",
		side: "",
		one_block: "",
		center: "",
		side_both: "",
	};
	rotation: number;
	player?: Player;
	playerSensor!: Fixture;
	exitPipe?: Pipe;
	exit?: string;
	checkedPipe = false;
	waitUntilNextEntry = false;
	exitOnly = false;
	tped = false;
	player_small = Sprite.from("player_small_stand");
	player_big_crouch = Sprite.from("player_big_crouch");
	player_big_stand = Sprite.from("player_big_stand");
	static props: Property[] = [
		{
			name: "exitName",
			type: PropType.string,
			defaultValue: "",
			descriptionKey: "exitNameDesc",
		},
		{
			name: "exitOnly",
			type: PropType.boolean,
			defaultValue: "false",
		},
	];
	constructor(
		pos: Vec2,
		shape: Shape,
		rotation: number,
		exit?: string,
		exitOnly: boolean = false,
	) {
		super({
			pos,
			friction: 0.75,
			shape,
			goid: GOID.Pipe,
		});
		this.rotation = rotation;
		this.exit = exit;
		this.exitOnly = exitOnly;
		this.player_small.anchor.set(0.5, 0.5);
		this.player_small.zIndex = -2;
		this.player_small.visible = false;

		this.player_big_crouch.anchor.set(0.5, 0.5);
		this.player_big_crouch.visible = false;
		this.player_big_crouch.zIndex = -2;

		this.player_big_stand.anchor.set(0.5, 0.5);
		this.player_big_stand.visible = false;
		this.player_big_stand.zIndex = -2;
		this.player_big_crouch.label = "Pipe: player_big_crouch";
		this.player_small.label = "Pipe: player_small_stand";
		this.player_big_stand.label = "Pipe: player_big_stand";
	}
	remove(world: World): boolean {
		world.main.removeChild(this.player_small);
		world.main.removeChild(this.player_big_stand);
		world.main.removeChild(this.player_big_crouch);

		return super.remove(world);
	}
	update(_dt: number, world: World): void {
		super.update(_dt, world);
		if (this.exitOnly) return;
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
		if (
			this.waitUntilNextEntry &&
			!Actions.hold("crouch") &&
			!Actions.hold("jump") &&
			!Actions.hold("left") &&
			!Actions.hold("right")
		) {
			this.waitUntilNextEntry = false;
		}
		if (this.waitUntilNextEntry) return;
		if (this.rotation == 0 && !Actions.hold("crouch")) return;
		if (this.rotation == 2 && !Actions.hold("jump")) return;
		if (this.rotation == 1 && !Actions.hold("left")) return;
		if (this.rotation == 3 && !Actions.hold("right")) return;

		world.pause = true;
		this.player.refreshTouchTick = world.tick + 2;
		this.player_small.scale.x = this.player.direction;
		this.player_big_stand.scale.x = this.player.direction;
		this.player_big_crouch.scale.x = this.player.direction;
		this.player.setAnim(
			this.player.powerState > PowerState.Small ? "big_walk" : "small_walk",
		);
		this.player.sprite.visible = false;
		const animSprite =
			this.player.powerState > PowerState.Small
				? this.rotation == 0
					? this.player_big_crouch
					: this.player_big_stand
				: this.player_small;

		animSprite.visible = true;
		animSprite.position = this.player.sprite.position;
		switch (this.rotation) {
			case 2:
			case 0: {
				const pipePosX = planckToPixi1D(this.pos.x);
				animSprite.x = pipePosX;
				break;
			}
			case 1:
			case 3: {
				const pipePosY = planckToPixi1D(this.pos.y);
				animSprite.y = pipePosY;
				break;
			}
		}
	}
	pausedUpdate(dt: number, world: World): void {
		if (!this.player) return;
		if (!this.tped) this.animEnter(dt, world);
		if (this.tped) this.animExit(dt, world);
	}
	animExit(dt: number, world: World) {
		if (!this.player) return;
		if (!this.exitPipe) return;
		if (this.exitPipe.rotation == 0) {
			const animYPos =
				this.player?.powerState > PowerState.Small
					? this.player_big_stand.y
					: this.player_small.y;

			if (this.player?.sprite.position.y - 20 > animYPos) {
				this.tped = false;
				world.pause = false;
				this.player_big_stand.visible = false;
				this.player_small.visible = false;
				this.player.sprite.visible = true;
				this.player = undefined;
				return;
			}

			this.player_big_stand.y -= 100 * dt;
			this.player_small.y -= 100 * dt;
			return;
		}
		if (this.exitPipe.rotation == 3) {
			const animXPos =
				this.player?.powerState > PowerState.Small
					? this.player_big_stand.x
					: this.player_small.x;

			if (this.player?.sprite.position.x - 10 > animXPos) {
				this.tped = false;
				world.pause = false;
				this.player_big_stand.visible = false;
				this.player_small.visible = false;
				this.player.sprite.visible = true;
				this.player = undefined;
				return;
			}

			this.player_big_stand.x -= 100 * dt;
			this.player_small.x -= 100 * dt;
			return;
		}
		if (this.exitPipe.rotation == 1) {
			const animXPos =
				this.player?.powerState > PowerState.Small
					? this.player_big_stand.x
					: this.player_small.x;

			if (this.player?.sprite.position.x + 10 < animXPos) {
				this.tped = false;
				world.pause = false;
				this.player_big_stand.visible = false;
				this.player_small.visible = false;
				this.player.sprite.visible = true;
				this.player = undefined;
				return;
			}

			this.player_big_stand.x += 100 * dt;
			this.player_small.x += 100 * dt;
			return;
		}
		if (this.exitPipe.rotation == 2) {
			const animYPos =
				this.player?.powerState > PowerState.Small
					? this.player_big_stand.y
					: this.player_small.y;

			if (this.player?.sprite.position.y + 25 < animYPos) {
				this.tped = false;
				world.pause = false;
				this.player_big_stand.visible = false;
				this.player_small.visible = false;
				this.player.sprite.visible = true;
				this.player = undefined;
				return;
			}

			this.player_big_stand.y += 100 * dt;
			this.player_small.y += 100 * dt;
			return;
		}
	}
	animEnter(dt: number, world: World) {
		if (!this.player) return;
		if (this.rotation == 0) {
			const animYPos =
				this.player?.powerState > PowerState.Small
					? this.player_big_crouch.y
					: this.player_small.y;

			if (this.player?.sprite.position.y + 100 < animYPos) {
				this.tpPlayer(world);
				this.tped = true;
				return;
			}

			this.player_big_crouch.y += 100 * dt;
			this.player_small.y += 100 * dt;
			return;
		}
		if (this.rotation == 3) {
			const animXPos =
				this.player?.powerState > PowerState.Small
					? this.player_big_stand.x
					: this.player_small.x;

			if (this.player?.sprite.position.x + 100 < animXPos) {
				this.tpPlayer(world);
				this.tped = true;
				return;
			}

			this.player_big_stand.x += 100 * dt;
			this.player_small.x += 100 * dt;
			return;
		}
		if (this.rotation == 1) {
			const animXPos =
				this.player?.powerState > PowerState.Small
					? this.player_big_stand.x
					: this.player_small.x;

			if (this.player?.sprite.position.x - 100 > animXPos) {
				this.tpPlayer(world);
				this.tped = true;
				return;
			}

			this.player_big_stand.x -= 100 * dt;
			this.player_small.x -= 100 * dt;
			return;
		}
		if (this.rotation == 2) {
			const animYPos =
				this.player?.powerState > PowerState.Small
					? this.player_big_stand.y
					: this.player_small.y;

			if (this.player?.sprite.position.y - 100 > animYPos) {
				this.tpPlayer(world);
				this.tped = true;
				return;
			}

			this.player_big_stand.y -= 100 * dt;
			this.player_small.y -= 100 * dt;
			return;
		}
	}
	tpPlayer(world: World) {
		const exitPipePos = this.exitPipe!.pos.clone();
		const s = this.exitPipe!.shape as PolygonShape;
		const w = Math.abs(s.m_vertices[3].x - s.m_vertices[0].x);
		const h = Math.abs(s.m_vertices[3].y - s.m_vertices[1].y);

		const offset = {
			true: () =>
				new Vec2(
					this.exitPipe!.rotation == 1 ? w / 2 + 0.25 : -(w / 2) - 0.25,
					0,
				),
			false: () =>
				new Vec2(
					0,
					this.exitPipe!.rotation == 2 ? h / 2 + 0.25 : -(h / 2) - 0.25,
				),
		}[String(this.exitPipe!.rotation == 1 || this.exitPipe!.rotation == 3)]!();
		exitPipePos.x += offset.x;
		exitPipePos.y += offset.y;
		this.exitPipe!.waitUntilNextEntry = true;
		this.player!.body.setPosition(exitPipePos);

		const exitPipePosPixi = planckToPixi(this.player!.body.getPosition());
		this.player!.sprite.x = exitPipePosPixi.x;
		this.player!.sprite.y = exitPipePosPixi.y;
		this.player!.touchedGrounds = [];

		this.player!.lastState = exitPipePos;
		const spriteOffset = {
			0: new Vec2(0, 100),
			1: new Vec2(-100, 0),
			2: new Vec2(0, -100),
			3: new Vec2(100, 0),
		}[this.exitPipe!.rotation]!;
		this.player_big_stand.position.x = exitPipePosPixi.x + spriteOffset.x;
		this.player_big_stand.position.y = exitPipePosPixi.y + spriteOffset.y;
		this.player_big_crouch.position.x = exitPipePosPixi.x + spriteOffset.x;
		this.player_big_crouch.position.y = exitPipePosPixi.y + spriteOffset.y;
		this.player_small.position.x = exitPipePosPixi.x + spriteOffset.x;
		this.player_small.position.y = exitPipePosPixi.y + spriteOffset.y;

		const big = this.player!.powerState > PowerState.Small;
		this.player_big_stand.visible = big;
		this.player_small.visible = !big;
		this.player_big_crouch.visible = false;

		const camOffset = this.player!.calculateCamOffset();
		world.main.pivot.set(
			this.player!.sprite.x + camOffset.x,
			this.player!.sprite.y + camOffset.y,
		);
		this.player!.pauseCamTilTick = world.tick +5;
		(world.entities.filter((v) => v.goid == GOID.Paralax) as Paralax[]).forEach(
			(v) => v.updatePos(world.main.pivot),
		);
	}
	static renderDrag(
		startPos: Vec2,
		currPos: Vec2,
		container: Container,
		rotation?: number,
	): void {
		const drawStartPos = getPosAtGrid(startPos);
		const drawEndPos = getPosAtGrid(currPos);

		const w = Math.ceil(Math.abs(drawEndPos.x - drawStartPos.x) / 32) * 32;
		const h = Math.ceil(Math.abs(drawEndPos.y - drawStartPos.y) / 32) * 32;
		const wR = h > w ? 1 * meter : Math.max(w, 64);
		const hR = h > w ? Math.max(h, 64) : 1 * meter;
		let r = rotation ?? (w > h ? 1 : 2);

		if (drawStartPos.x > drawEndPos.x) {
			container.x = h > w ? drawStartPos.x - 1 * meter : drawStartPos.x - w;
			if (!rotation && r == 1) r = 3;
		}
		if (drawStartPos.y > drawEndPos.y) {
			container.y = w > h ? drawStartPos.y - 1 * meter : drawStartPos.y - h;
			if (!rotation && r == 2) r = 0;
		}
		if (r == 0) {
			const bottom = new TilingSprite({
				texture: Texture.from("pipe_bottom"),
				width: h > w ? wR : wR - Editor.gridSize * 2,
				height: h > w ? hR - Editor.gridSize * 2 : hR,
				y: Editor.gridSize * 2,
			});
			if (wR == 64 && hR == 64) {
				bottom.width = 64;
				bottom.height = 32;
			}
			const top = new TilingSprite({
				texture: Texture.from("pipe_top"),
				width: 64,
				height: 32,
			});

			container.addChild(bottom, top);
		} else if (r == 1) {
			const bottom = new TilingSprite({
				texture: Texture.from("pipe_bottom"),
				rotation: -Math.PI / 2,
				height: h > w ? wR : wR - Editor.gridSize * 2,
				width: h > w ? hR - Editor.gridSize * 2 : hR,
				y: meter,
			});

			const top = new TilingSprite({
				texture: Texture.from("pipe_top"),
				rotation: -Math.PI / 2,
				height: Editor.gridSize * 2,
				width: Editor.gridSize * 4,
				x: wR - Editor.gridSize * 2,
				y: Editor.gridSize * 4,
			});

			container.addChild(bottom, top);
		} else if (r == 2) {
			const bottom = new TilingSprite({
				texture: Texture.from("pipe_bottom"),
				rotation: Math.PI,
				width: h > w ? wR : wR - Editor.gridSize * 2,
				height: h > w ? hR - Editor.gridSize * 2 : hR,
				y: hR - 32,
				x: 64,
			});
			const top = new TilingSprite({
				rotation: Math.PI,
				texture: Texture.from("pipe_top"),
				width: 64,
				height: 32,
				y: hR,
				x: 64,
			});
			if (wR == 64 && hR == 64) {
				bottom.width = 64;
				bottom.height = 32;
			}
			container.addChild(bottom, top);
		} else if (r == 3) {
			const bottom = new TilingSprite({
				texture: Texture.from("pipe_bottom"),
				rotation: Math.PI / 2,
				height: h > w ? wR : wR - Editor.gridSize * 2,
				width: h > w ? hR - Editor.gridSize * 2 : hR,
				x: wR,
			});

			const top = new TilingSprite({
				texture: Texture.from("pipe_top"),
				rotation: Math.PI / 2,
				height: Editor.gridSize * 2,
				width: Editor.gridSize * 4,
				x: 32,
			});

			container.addChild(bottom, top);
		}
	}
	create(world: World): void {
		this.body = world.p.createBody({
			position: this.pos,
			fixedRotation: this.fixedRotation,
			type: this.bodyType,
		});

		this.mainFix = this.body.createFixture({
			density: this.density,
			shape: this.shape,
			friction: this.friction,
			filterCategoryBits: 0b1,
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
		Pipe.renderDrag(gridPos, gridEndPos, this.cont, this.rotation);

		world.main.addChild(this.cont);

		const offset = {
			true: () => new Vec2(this.rotation == 1 ? w / 2 : -(w / 2), 0),
			false: () => new Vec2(0, this.rotation == 2 ? h / 2 : -(h / 2)),
		}[String(this.rotation == 1 || this.rotation == 3)]!();

		this.playerSensor = this.body.createFixture({
			isSensor: true,
			filterMaskBits: 0b10,
			shape: new Box(0.45, 0.1, offset, this.rotation * (Math.PI / 2)),
		});

		world.main.addChild(this.player_big_crouch);
		world.main.addChild(this.player_big_stand);
		world.main.addChild(this.player_small);
		if (this.exitOnly || !this.exit) return;
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
		const wR = h > w ? 1 : Math.max(wA, 1);
		const hR = h > w ? Math.max(hA, 1) : 1;
		let rotation = w > h ? 1 : 2;
		if (startPos.x > currPos.x) {
			pos.x -= (w % 0.5) / 2;
			if (rotation == 1) rotation = 3;
		} else {
			pos.x += (w % 0.5) / 2;
		}
		if (startPos.y > currPos.y) {
			pos.y -= (h % 0.5) / 2;
			if (rotation == 2) rotation = 0;
		} else {
			pos.y += (h % 0.5) / 2;
		}
		if (h > w) {
			pos.x -= startPos.x > currPos.x ? -(wA / 2 - 0.5) : wA / 2 - 0.5;
		} else {
			pos.y -= startPos.y > currPos.y ? -(hA / 2 - 0.5) : hA / 2 - 0.5;
		}

		const exit = props?.find((v) => v.name == "exitName");
		const exitOnly = props?.find((v) => v.name == "exitOnly")?.value == "true";
		return new Pipe(
			pos,
			new Box(wR / 2, hR / 2),
			rotation,
			exit?.value,
			exitOnly,
		);
	}
	serialize(): SerializedGO {
		return {
			_type: this.goid,
			data: {
				pos: this.pos,
				shapeVerts: (this.shape as PolygonShape).m_vertices,
				rotation: this.rotation,
				exit: this.exit,
				exitOnly: this.exitOnly,
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
			obj.data.exitOnly,
		);
	}
}
