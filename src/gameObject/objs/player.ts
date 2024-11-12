import { Box, Contact, Fixture, Polygon, Vec2 } from "planck-js";
import { AnimatedSprite, Sprite, Texture } from "pixi.js";
import { Entity } from "../types/entity";
import { World } from "world";
import { lerp2D } from "@lib/math/lerp";
import { Actions } from "@lib/input";
import { meter, planckToPixi } from "@lib/math/units";
import { GOID } from "gameObject";
import { Howler } from "howler";
import { Timer } from "@lib/ticker";

export const PowerState = {
	Small: 1,
	Big: 2,
} as const;
export const ActionState = {
	Jump: 1,
	Walk: 2,
	Crouch: 3,
	Roll: 4,
	GroundPound: 5,
	LongJump: 6,
	Dive: 7,
	Locked: 8,
	Run: 9,
} as const;
export type PState = (typeof PowerState)[keyof typeof PowerState];
export type AState = (typeof ActionState)[keyof typeof ActionState];
export type PlayerAnims = keyof Player["anims"];

export class Player extends Entity {
	walkForce = 600;
	runForce = 800;
	rollForce = 1000;
	longJumpVertForce = 1500;
	jumpForce = -10000;
	diveForce = 100000;
	groundpoundSpeed = 25;
	sensor!: Fixture;
	onGround = false;
	direction = 1;
	divingDelay = new Timer(0.5);
	actionStates: AState[] = [];
	static maxInstances = 1;
	jumpSound = new Howl({
		src: ["./jump.mp3"],
		volume: 0.25,
	});
	powerState: PState = PowerState.Small;
	anims = {
		small_walk: new AnimatedSprite([
			Texture.from("player_small_stand"),
			Texture.from("player_small_walk_1"),
		]),
		big_walk: new AnimatedSprite([
			Texture.from("player_big_stand"),
			Texture.from("player_big_walk_1"),
		]),
		small_jump: Sprite.from("player_small_jump"),
		big_jump: Sprite.from("player_big_jump"),
		roll: Sprite.from("player_roll"),
	} as const;
	currentAnim: PlayerAnims = "small_walk";
	lastAnim: PlayerAnims = "small_walk";
	maxVel = new Vec2(15, -20);
	bigShape = new Box(0.23, 0.5);
	smallShape = new Box(0.23, 0.23);
	sensorShape = new Box(0.2, 0.05, new Vec2(0, 0.2));
	constructor(pos: Vec2) {
		super({
			pos,
			friction: 0.2,
			density: 2,
			shape: new Box(0.1, 0.1),
			sprite: Sprite.from("player_small_stand"),
			bodyType: "dynamic",
			fixedRotation: true,
			goid: GOID.Player,
		});
		this.shape = this.smallShape;
		this.anims.small_walk.anchor.set(0.5, 0.5);
		this.anims.small_walk.animationSpeed = 0;
		this.anims.small_walk.play();
		this.anims.small_jump.anchor.set(0.5, 0.5);
		this.anims.roll.anchor.set(0.5, 0.5);

		this.anims.big_walk.anchor.set(0.5, 0.5);
		this.anims.big_walk.animationSpeed = 0;
		this.anims.big_walk.play();
		this.anims.big_jump.anchor.set(0.5, 0.5);

		this.setPState(PowerState.Big);
	}
	create(world: World): void {
		super.create(world);
		world.main.removeChild(this.sprite);
		Object.values(this.anims).forEach((v) => {
			v.visible = false;
			world.main.addChild(v);
		});
		this.setAnim(this.currentAnim);

		this.sensor = this.body.createFixture({
			shape: this.sensorShape,
			isSensor: true,
			filterMaskBits: 10,
		});

		world.p.on("begin-contact", (contact) => {
			this.checkGround(contact);
		});

		world.p.on("end-contact", (contact) => {
			this.checkGround(contact);
		});
	}
	setAnim(anim: PlayerAnims) {
		this.anims[this.currentAnim].visible = false;
		this.currentAnim = anim;
		this.anims[anim].x = this.sprite.x;
		this.anims[anim].y = this.sprite.y;
		this.sprite = this.anims[anim];
		this.sprite.visible = true;
	}
	setPState(state: PState) {
		this.powerState = state;
		this.setBigHitbox(state >= PowerState.Big);
	}
	setBigHitbox(yes?: boolean) {
		this.density = yes ? 1 : 2;
		if (this.mainFix) this.mainFix.m_density = this.density;
		this.shape = yes ? this.bigShape : this.smallShape;
		this.sensorShape.m_vertices.forEach((v) => (v.y -= yes ? -0.25 : 0.25));
	}
	checkGround(contact: Contact) {
		const fixA = contact.getFixtureA();
		const fixB = contact.getFixtureB();

		if (fixA != this.sensor && fixB != this.sensor) return;

		this.onGround = contact.isTouching();
	}
	update(dt: number, world: World): void {
		super.update(dt, world);
		this.followCam(world, dt);
		this.handleMove(dt);
		this.handleAnim();
	}
	followCam(world: World, dt: number) {
		const pos = lerp2D(
			new Vec2(world.main.pivot.x, world.main.pivot.y),
			new Vec2(this.sprite.x, this.sprite.y),
			20 * dt,
		);
		world.main.pivot.set(pos.x, pos.y);
		Howler.pos(this.pos.x, this.pos.y);
	}
	handleAnim() {
		const vel = this.body.getLinearVelocity();
		this.anims.small_walk.animationSpeed = 0.02 * vel.x;
		this.anims.big_walk.animationSpeed = 0.02 * vel.x;
		if (vel.x == 0) {
			this.anims.small_walk.currentFrame = 0;
			this.anims.big_walk.currentFrame = 0;
		}
		if (this.powerState < PowerState.Big) {
			if (
				this.actionStates.includes(ActionState.Jump) &&
				this.currentAnim != "small_jump"
			) {
				this.setAnim("small_jump");
			} else if (
				!this.actionStates.includes(ActionState.Jump) &&
				this.currentAnim != "small_walk" &&
				this.onGround
			) {
				this.setAnim("small_walk");
			}
		} else {
			if (this.currentAnim.startsWith("small")) this.setAnim("big_walk");
			if (
				this.actionStates.includes(ActionState.Jump) &&
				this.currentAnim != "big_jump"
			) {
				this.setAnim("big_jump");
			} else if (
				!this.actionStates.includes(ActionState.Jump) &&
				this.currentAnim != "big_walk" &&
				this.onGround
			) {
				this.setAnim("big_walk");
			}
		}
	}
	handleMove(dt: number) {
		if (Actions.hold("left")) {
			this.direction = -1;
		}

		if (Actions.hold("right")) {
			this.direction = 1;
		}
		this.sprite.scale.x = this.direction;

		this.handleWalk(dt);
		this.handleJump(dt);
		this.jumpSound.pos(this.pos.x, this.pos.y);
		this.checkMaxVel();
	}
	handleWalk(dt: number) {
		const shouldWalk = Actions.hold("left") || Actions.hold("right");
		const shouldRun = shouldWalk && Actions.hold("run");
		this.checkActionState(ActionState.Run, shouldRun);
		if (this.checkActionState(ActionState.Walk, shouldWalk)) return;

		const speed = this.actionStates.includes(ActionState.Run)
			? this.runForce
			: this.walkForce;
		this.body.applyForceToCenter(
			new Vec2(speed * dt * this.direction, 0),
			true,
		);
	}
	handleJump(dt: number) {
		if (this.actionStates.includes(ActionState.Locked)) return;
		if (this.actionStates.includes(ActionState.Roll)) return;

		const shouldJump =
			(Actions.hold("jump") && this.onGround) ||
			(this.actionStates.includes(ActionState.Jump) && Actions.hold("jump"));
		if (this.checkActionState(ActionState.Jump, shouldJump)) {
			this.actionStates = this.actionStates.filter(
				(v) => v != ActionState.Jump,
			);
			return;
		}

		this.body?.applyForce(
			new Vec2(0, this.jumpForce * dt),
			new Vec2(0, -1),
			true,
		);
	}
	checkActionState(actionState: AState, should: boolean): boolean {
		if (!should && this.actionStates.includes(actionState)) {
			this.actionStates = this.actionStates.filter((v) => v != actionState);
			return true;
		}
		if (should && !this.actionStates.includes(actionState)) {
			this.actionStates.push(actionState);
			return false;
		}
		if (!should && !this.actionStates.includes(actionState)) return true;
		if (should && this.actionStates.includes(actionState)) return false;
		return false;
	}
	checkMaxVel() {
		const maxVel = this.actionStates.map((v) => {
			if (v == ActionState.Roll) return new Vec2(25, -15);
			if (v == ActionState.LongJump) return new Vec2(30, -15);
			if (v == ActionState.Dive) return new Vec2(20, -15);
			if (v == ActionState.Run) return new Vec2(10, -22.5);

			return new Vec2(5, -15);
		});
		const maxX = Math.max(...maxVel.map((v) => v.x), 5);
		const maxY = Math.max(...maxVel.map((v) => v.y), -15);
		this.maxVel.x = maxX;
		this.maxVel.y = maxY;

		const vel = this.body.getLinearVelocity();
		if (Math.abs(vel.x) > this.maxVel.x)
			this.body.setLinearVelocity(
				new Vec2(this.maxVel.x * this.direction, vel.y),
			);

		if (vel.y < this.maxVel.y) {
			this.body.setLinearVelocity(new Vec2(vel.x, this.maxVel.y));
			this.actionStates = this.actionStates.filter(
				(v) => v != ActionState.Jump,
			);
		}
	}
}
