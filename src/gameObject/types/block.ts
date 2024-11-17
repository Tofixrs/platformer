import { Container, Sprite, Texture, TilingSprite } from "pixi.js";
import {
	PhysicsObject,
	PhysicsObjectOptions,
	PhysObjUserData,
} from "./physicsObject";
import { pixiToPlanck, planckToPixi } from "@lib/math/units";
import { World } from "world";
import { Contact, Manifold, Vec2 } from "planck-js";
import { getPosAtGrid } from "@worlds/editor";
import { GameObjectID, GOID } from "gameObject";
import { Brick } from "@gameObjs/brick";
type BlockOptions = Omit<
	PhysicsObjectOptions,
	"fixedRotation" | "bodyType" | "density"
> & {
	sprite: Sprite;
};

export class Block extends PhysicsObject {
	static dragTexture: Texture;
	sprite: Sprite;
	static draggable: boolean = true;
	hit = false;
	hitID?: string;
	anim = false;
	static item: GameObjectID = "koopa";
	defaultSpritePos: Vec2;
	swapDirection = false;
	constructor(opt: BlockOptions) {
		super({
			bodyType: "static",
			fixedRotation: true,
			density: 0,
			...opt,
		});

		this.sprite = opt.sprite;
		this.sprite.anchor.set(0.5, 0.5);
		const spritePos = planckToPixi(this.pos);
		this.sprite.x = spritePos.x;
		this.sprite.y = spritePos.y;
		this.defaultSpritePos = new Vec2(spritePos.x, spritePos.y);
	}
	static renderDrag(startPos: Vec2, currPos: Vec2, container: Container): void {
		const drawStartPos = getPosAtGrid(startPos);
		const drawEndPos = getPosAtGrid(currPos);

		const w = Math.ceil(Math.abs(drawEndPos.x - drawStartPos.x) / 32) * 32;
		const h = Math.ceil(Math.abs(drawEndPos.y - drawStartPos.y) / 32) * 32;
		const size = new Vec2(w, h);

		const spr = new TilingSprite({
			texture: Texture.from("brick"),
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
			userData: {
				goid: this.goid,
				id: this.id,
			},
			filterCategoryBits: 10,
		});
		world.main.addChild(this.sprite);
		world.p.on("pre-solve", (contact, oldManifold) =>
			this.preSolve(contact, oldManifold),
		);
	}
	remove(world: World, force?: boolean): boolean {
		super.remove(world, force);
		world.main.removeChild(this.sprite);
		return true;
	}
	update(dt: number, world: World): void {
		if (this.hit) {
			this.anim = this.onHit(world);
			this.hit = false;
			this.hitID = undefined;
		}

		if (!this.anim) return;
		if (
			Math.abs(this.sprite.y) - Math.abs(this.defaultSpritePos.y) < -16 &&
			!this.swapDirection
		) {
			this.swapDirection = true;
		}
		this.sprite.y -= dt * 200 * (this.swapDirection ? -1 : 1);
		if (Math.abs(this.sprite.y) > Math.abs(this.defaultSpritePos.y)) {
			this.anim = false;
			this.swapDirection = false;
			this.sprite.x = this.defaultSpritePos.x;
			this.sprite.y = this.defaultSpritePos.y;
		}
	}
	preSolve(contact: Contact, _oldManifold: Manifold) {
		const fixA = contact.getFixtureA();
		const fixB = contact.getFixtureB();
		const userA = fixA.getUserData() as PhysObjUserData;
		const userB = fixB.getUserData() as PhysObjUserData;
		if (userA == null || userB == null) return;
		if (userA.id != this.id && userB.id != this.id) return;
		if (userA.goid != GOID.Player && userB.goid != GOID.Player) return;

		const user = userA.goid == GOID.Player ? userA : userB;
		const worldManifold = contact.getWorldManifold(undefined);
		if (worldManifold!.normal.y > 0 || worldManifold?.normal.x != 0) return;
		this.hit = true;
		this.hitID = user.id;
	}
	onHit(_world: World): boolean {
		return true;
	}
}

export function fillBlocks(
	world: World,
	startPos: Vec2,
	currPos: Vec2,
	goClass: typeof Block,
) {
	const drawStartPos = getPosAtGrid(startPos);
	const drawEndPos = getPosAtGrid(currPos);

	const w = Math.ceil(Math.abs(drawEndPos.x - drawStartPos.x) / 32);
	const h = Math.ceil(Math.abs(drawEndPos.y - drawStartPos.y) / 32);
	const left = drawEndPos.x < drawStartPos.x;
	const top = drawEndPos.y < drawStartPos.y;
	let x = drawStartPos.x + (left ? -16 : 16);
	let y = drawStartPos.y + (top ? -16 : 16);
	for (let i = 1; i <= w; i++) {
		for (let j = 1; j <= h; j++) {
			switch (goClass) {
				//@ts-expect-error
				case Brick: {
					const pos = pixiToPlanck(new Vec2(x, y));
					world.addEntity(new Brick(pos));
					break;
				}
			}
			y += top ? -32 : 32;
		}
		y = drawStartPos.y + (top ? -16 : 16);
		x += left ? -32 : 32;
	}
}
