import { meter, planckToPixi } from "@lib/math/units";
import { SerializedGO } from "@lib/serialize";
import { GameObject, GOID, PropertyValue } from "gameObject";
import { PhysicsObject, PhysObjUserData } from "gameObject/types/physicsObject";
import { Sprite } from "pixi.js";
import { Box, Shape, Vec2 } from "planck-js";
import { World } from "world";
import { Player, PowerState } from "./player";
import { Timer } from "@lib/ticker";

export class Flag extends PhysicsObject {
	main: Sprite = Sprite.from("flagpole");
	flag: Sprite = Sprite.from("flag");
	player_small = Sprite.from("player_small_flag");
	player_big = Sprite.from("player_big_flag");
	win = false;
	playerId?: string;
	winAnimDone = false;
	animDelayTimer = new Timer(0.5);
	animDelayFinishTimer = new Timer(0.5);
	constructor(pos: Vec2) {
		super({
			shape: new Box(0.25, 5),
			bodyType: "static",
			friction: 0,
			density: 0,
			fixedRotation: true,
			goid: GOID.Flag,
			pos,
		});

		const pixiPos = planckToPixi(pos);
		this.main.anchor.set(0.5, 0.5);
		this.main.x = pixiPos.x;
		this.main.y = pixiPos.y;
		this.flag.y = -4.7 * meter;
		this.flag.x = -meter * 0.55;
		this.player_small.x = -meter * 0.55;
		this.player_big.x = -meter * 0.55;
		this.player_small.anchor.set(0, 0);
		this.player_big.anchor.set(0, 0.5);
		this.player_small.visible = false;
		this.player_big.visible = false;

		this.main.addChild(this.flag);
		this.main.addChild(this.player_small);
		this.main.addChild(this.player_big);
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
			isSensor: true,
		});

		world.p.on("begin-contact", (contact) => {
			const fixA = contact.getFixtureA();
			const fixB = contact.getFixtureB();

			if (fixA != this.mainFix && fixB != this.mainFix) return;
			const userA = fixA.getUserData() as PhysObjUserData;
			const userB = fixB.getUserData() as PhysObjUserData;
			if (!userA || !userB) return;

			const otherUser = userA.goid == GOID.Flag ? userB : userA;
			if (otherUser.goid != GOID.Player) return;

			this.win = true;
			this.playerId = otherUser.id;
		});

		world.main.addChild(this.main);
	}
	update(_dt: number, world: World): void {
		if (!this.win) return;
		const player = world.entities.find((v) => v.id == this.playerId!) as Player;

		const yPos = player.sprite.y - this.main.y;
		this.player_small.y = yPos;
		this.player_big.y = yPos;

		if (player.powerState < PowerState.Big) {
			this.player_small.visible = true;
		} else {
			this.player_big.visible = true;
		}

		world.entities.forEach((v) => {
			if (v.goid != GOID.Player) return;
			world.removeEntity(v.id, true);
		});
		world.pause = true;
	}
	pausedUpdate(dt: number, _world: World): void {
		if (!this.win) return;
		this.animDelayTimer.tick(dt);
		if (!this.animDelayTimer.done()) return;
		if (this.flag.y <= 4 * meter) {
			this.flag.y += 200 * dt;
		}
		if (this.player_small.y <= 4 * meter) {
			this.player_small.y += 200 * dt;
		}
		if (this.player_big.y <= 4 * meter) {
			this.player_big.y += 200 * dt;
		}
		if (
			this.flag.y <= 4 * meter ||
			this.player_big.y <= 4 * meter ||
			this.player_small.y <= 4 * meter
		)
			return;

		this.animDelayFinishTimer.tick(dt);
		if (!this.animDelayFinishTimer.done()) return;
		this.winAnimDone = true;
	}
	remove(world: World, _force?: boolean): boolean {
		super.remove(world, _force);
		world.main.removeChild(this.main);
		return true;
	}
	static commonConstructor(
		pos: Vec2,
		_shape: Shape,
		_startPos: Vec2,
		_currPos: Vec2,
		_props?: PropertyValue[],
	): GameObject {
		pos.y -= 5;
		return new Flag(pos);
	}
	serialize(): SerializedGO {
		return {
			_type: this.goid,
			data: this.pos,
		};
	}
	static deserialize(obj: SerializedGO): GameObject {
		return new Flag(new Vec2(obj.data.x, obj.data.y));
	}
}
