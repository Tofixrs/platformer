import { Box, Contact, Fixture, Shape, Vec2 } from "planck";
import { AnimatedSprite, Sprite, Texture } from "pixi.js";
import { Entity } from "../types/entity";
import { World } from "world";
import { Actions } from "@lib/input";
import { GameObject, GOID, Property, PropertyValue } from "gameObject";
import { Howler } from "howler";
import { Timer } from "@lib/ticker";
import { PhysObjUserData } from "gameObject/types/physicsObject";
import { capsule } from "@lib/shape";
import { pixiToPlanck, pixiToPlanck1D, planckToPixi } from "@lib/math/units";
import { SerializedGO } from "@lib/serialize";
import { smoothDamp2D } from "@lib/math/smoothDamp";
import type { CameraWall } from "./cameraWall";

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
	walkForce = 500;
	runForce = 600;
	rollForce = 700;
	longJumpVertForce = 1500;
	jumpForce = -10000;
	diveForce = 350;
	groundpoundSpeed = 15;
	sensor!: Fixture;
	touchedGrounds: string[] = [];
	direction = 1;
	divingDelay = new Timer(0.75);
	actionStates: AState[] = [];
	groundPoundHit = false;
	dmg = false;
	die = false;
	dieVel = 0;
	dieAcc = 0;
	diePos?: Vec2;
	static maxInstances = 1;
	jumpSound = new Howl({
		src: ["./sounds/jump.mp3"],
		volume: 0.25,
	});
	powerUpSound = new Howl({
		src: ["./sounds/powerup.wav"],
		volume: 0.5,
	});
	dmgSound = new Howl({
		src: ["./sounds/dmg.wav"],
		volume: 1,
	});
	deathSound = new Howl({
		src: ["./sounds/death.wav"],
		volume: 1,
	});
	powerState: PState = PowerState.Small;
	invTimer = new Timer(1, true);
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
		grow_anim: new AnimatedSprite([
			Texture.from("player_small_stand"),
			Texture.from("player_big_stand"),
			Texture.from("player_small_stand"),
			Texture.from("player_big_stand"),
			Texture.from("player_small_stand"),
			Texture.from("player_big_stand"),
			Texture.from("player_big_stand"),
		]),
		shrink_anim: new AnimatedSprite([
			Texture.from("player_big_stand"),
			Texture.from("player_small_stand"),
			Texture.from("player_big_stand"),
			Texture.from("player_small_stand"),
			Texture.from("player_big_stand"),
			Texture.from("player_small_stand"),
			Texture.from("player_small_stand"),
		]),
		crouch: Sprite.from("player_big_crouch"),
		dive: Sprite.from("player_dive"),
		die: Sprite.from("player_small_stand"),
	} as const;
	currentAnim: PlayerAnims = "small_walk";
	lastAnim: PlayerAnims = "small_walk";
	maxVel = new Vec2(15, -20);
	bigShape = capsule(new Vec2(0.23, 0.45), new Vec2(0, 0.05));
	smallShape = capsule(new Vec2(0.23, 0.23), new Vec2(0, 0.02));
	diveShape = capsule(new Vec2(0.23, 0.45), Vec2.zero(), Math.PI / 2);
	sensorShape = new Box(0.2, 0.05, new Vec2(0, 0.2));
	smallSensorShape = new Box(0.2, 0.05, new Vec2(0, 0.2));
	rollSensorShape = capsule(new Vec2(0.25, 0.25));
	bigSensorShape = new Box(0.2, 0.05, new Vec2(0, 0.45));
	sensorDiveShape = new Box(0.4, 0.1, new Vec2(0, 0.2));
	refreshTouchTick?: number;
	camVelocity = Vec2.zero();
	cameraWalls?: CameraWall[];
	static props: Property[] = [
		{
			type: "number",
			name: "pState",
			defaultValue: "1",
			descriptionKey: "pStateDesc",
		},
	];
	constructor(pos: Vec2, powerState: PState) {
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
		this.anims.grow_anim.animationSpeed = 0.125;
		this.anims.grow_anim.loop = false;
		this.anims.grow_anim.anchor.set(0.5, 0.5);

		this.anims.shrink_anim.animationSpeed = 0.125;
		this.anims.shrink_anim.loop = false;
		this.anims.shrink_anim.anchor.set(0.5, 0.5);
		this.anims.crouch.anchor.set(0.5, 0.75);
		this.anims.dive.anchor.set(0.5, 0.5);
		this.powerState = powerState;
		this.anims.die.anchor.set(0.5, 0.5);
	}
	static commonConstructor(
		pos: Vec2,
		_shape: Shape,
		_startPos: Vec2,
		_currPos: Vec2,
		props: PropertyValue[],
	): GameObject {
		const pState = props.find((v) => v.name == "pState");
		return new Player(
			pos,
			isNaN(Number(pState?.value))
				? PowerState.Small
				: (Number(pState?.value) as PState),
		);
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
			filterMaskBits: 0b1,
		});

		world.p.on("begin-contact", (contact) => {
			this.checkGround(contact);
		});

		world.p.on("end-contact", (contact) => {
			this.checkGround(contact);
		});

		world.p.on("pre-solve", (contact) => {
			this.checkInv(contact);
		});
		this.setPState(this.powerState, world, false);
		this.handleAnim();
	}
	remove(world: World, force?: boolean, anim?: boolean): boolean {
		if (!this.invTimer.done()) return false;
		if (this.powerState > PowerState.Small && !force) {
			this.setPState(PowerState.Small, world);
			this.dmgSound.play();
			this.invTimer.reset();
			this.sprite.alpha = 0.5;
			return false;
		} else if (!force || (force && anim)) {
			this.setAnim("die");
			this.die = true;
			this.dieAcc = 500;
			this.dieVel = 1000;
			this.diePos = undefined;
			world.pause = true;
			this.deathSound.play();
			return false;
		} else {
			super.remove(world, force);
			return true;
		}
	}
	pausedUpdate(dt: number, world: World): void {
		if (this.die) {
			if (this.currentAnim != "die") this.setAnim("die");
			if (!this.diePos) this.diePos = planckToPixi(this.pos);
			this.dieVel += this.dieAcc * dt;
			this.dieAcc -= 10000 * dt;
			this.sprite.y -= this.dieVel * dt;

			if (this.sprite.y - 500 > this.diePos!.y && !this.deathSound.playing()) {
				world.removeEntity(this.id, true);
				this.die = false;
			}
		}
		if (this.dmg) {
			if (
				this.currentAnim != "grow_anim" &&
				this.currentAnim != "shrink_anim"
			) {
				if (this.powerState > PowerState.Small) this.setAnim("grow_anim");
				if (this.powerState < PowerState.Big) this.setAnim("shrink_anim");
				return;
			}
			if (this.currentAnim == "grow_anim") {
				if (this.anims[this.currentAnim].texture.label == "player_big_stand") {
					this.anims[this.currentAnim].anchor.set(0.5, 0.5);
				} else {
					this.anims[this.currentAnim].anchor.set(0.5, 0);
				}
			} else {
				if (this.anims[this.currentAnim].texture.label == "player_big_stand") {
					this.anims[this.currentAnim].anchor.set(0.5, 0.75);
				} else {
					this.anims[this.currentAnim].anchor.set(0.5, 0.5);
				}
			}
			if (!this.anims[this.currentAnim].playing) {
				world.pause = false;
				this.dmg = false;
				this.anims[this.currentAnim].currentFrame = 0;
				if (this.powerState > PowerState.Small) {
					this.setAnim("big_walk");
				} else {
					this.setAnim("small_walk");
				}
			}
		}
	}
	update(dt: number, world: World): void {
		super.update(dt, world);
		this.checkCameraWalls(world);
		this.followCam(world, dt);
		this.handleAnim();
		this.handleMove(dt);

		if (world.tick >= this.refreshTouchTick!) {
			this.touchedGrounds = [];
			this.refreshTouchTick = undefined;
		}
		this.invTimer.tick(dt);
		if (this.invTimer.doneOnece()) {
			this.sprite.alpha = 1;
		}
	}
	checkCameraWalls(world: World) {
		if (this.cameraWalls) return;
		this.cameraWalls = world.entities.filter(
			(v) => v.goid == GOID.CameraWall,
		) as CameraWall[];
	}
	followCam(world: World, dt: number) {
		if (!this.cameraWalls) return;
		const currentPos = new Vec2(world.main.pivot.x, world.main.pivot.y);
		const offset = this.calculateCamOffset();
		const targetPos = new Vec2(
			this.sprite.x + offset.x,
			this.sprite.y + offset.y,
		);
		const pos = smoothDamp2D(currentPos, targetPos, this.camVelocity, 0.25, dt);

		world.main.pivot.set(pos.x, pos.y);
		const offsetPlanck = pixiToPlanck(new Vec2(offset.x, offset.y));
		Howler.pos(this.pos.x + offsetPlanck.x, this.pos.y + offsetPlanck.y);
	}
	calculateCamOffset() {
		const rightScreenEdge = this.sprite.x + window.innerWidth / 2;
		const leftScreenEdge = this.sprite.x - window.innerWidth / 2;
		const topScreenEdge = this.sprite.y - window.innerHeight / 2;
		const bottomScreenEdge = this.sprite.y + window.innerHeight / 2;
		return this.cameraWalls
			?.filter((v) => {
				if (
					v.rightEdge > leftScreenEdge &&
					v.leftEdge < rightScreenEdge &&
					v.bottomEdge > topScreenEdge &&
					v.topEdge < bottomScreenEdge
				)
					return true;
				return false;
			})
			.map((v) => {
				if (!v.vertical) {
					if (v.leftEdge < rightScreenEdge && v.leftEdge > leftScreenEdge) {
						return {
							y: 0,
							x: v.leftEdge - rightScreenEdge,
						};
					}
					if (v.rightEdge > leftScreenEdge && v.rightEdge < rightScreenEdge) {
						return {
							y: 0,
							x: v.rightEdge - leftScreenEdge,
						};
					}
				} else {
					if (v.bottomEdge > topScreenEdge && v.bottomEdge < bottomScreenEdge) {
						return {
							y: v.bottomEdge - topScreenEdge,
							x: 0,
						};
					}

					if (v.topEdge < bottomScreenEdge && v.topEdge > topScreenEdge) {
						return {
							x: 0,
							y: v.topEdge - bottomScreenEdge,
						};
					}
				}

				return { x: 0, y: 0 };
			})
			.reduce(
				(a, b) => {
					a.x += b.x;
					a.y += b.y;
					return a;
				},
				{ x: 0, y: 0 },
			)!;
	}
	handleMove(dt: number) {
		if (Actions.hold("left")) {
			this.direction = -1;
		}

		if (Actions.hold("right")) {
			this.direction = 1;
		}
		this.sprite.scale.x = this.direction;
		this.checkMaxVel();
		this.handleWalk(dt);
		this.handleJump(dt);
		this.handleCrouch();
		this.handleRoll(dt);
		this.handleDive(dt);
		this.handleGroundPound();
	}
	handleWalk(dt: number) {
		if (this.actionStates.includes(ActionState.Locked)) return;
		if (this.actionStates.includes(ActionState.Crouch) && this.onGround) return;
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
		if (this.checkActionState(ActionState.Jump, shouldJump)) return;
		if (this.onGround) {
			this.jumpSound.stop();
			this.jumpSound.play();
		}

		this.body?.applyForce(
			new Vec2(0, this.jumpForce * dt),
			new Vec2(0, -1),
			true,
		);
		if (this.body.getLinearVelocity().y < -2) {
			this.touchedGrounds = [];
		}
	}
	handleCrouch() {
		if (this.powerState < PowerState.Big) return;
		if (this.actionStates.includes(ActionState.Locked)) return;
		if (this.actionStates.includes(ActionState.Dive)) return;
		if (this.actionStates.includes(ActionState.GroundPound)) return;
		const shouldCrouch = Actions.hold("crouch");
		if (this.actionStates.includes(ActionState.Crouch) && !shouldCrouch) {
			this.setBigHitbox(true);
			this.body.setAwake(true);
		}
		if (!this.actionStates.includes(ActionState.Crouch) && shouldCrouch) {
			this.setBigHitbox(false);
			this.body.setAwake(true);
		}
		if (this.checkActionState(ActionState.Crouch, shouldCrouch)) return;
	}
	handleRoll(dt: number) {
		if (
			this.powerState < PowerState.Big &&
			!this.actionStates.includes(ActionState.Roll)
		)
			return;
		if (this.actionStates.includes(ActionState.Locked)) return;
		if (this.actionStates.includes(ActionState.Dive)) return;
		if (this.actionStates.includes(ActionState.GroundPound)) return;
		const shouldRoll =
			Actions.hold("roll") &&
			this.actionStates.includes(ActionState.Crouch) &&
			(Actions.hold("left") || Actions.hold("right"));
		if (this.actionStates.includes(ActionState.Roll) && !shouldRoll) {
			this.body.setFixedRotation(true);
			this.body.setAngle(0);
			this.body.setAwake(true);
			this.sensorShape.m_vertices = this.bigSensorShape.m_vertices;
		}
		if (!this.actionStates.includes(ActionState.Roll) && shouldRoll) {
			this.body.setAwake(true);
			this.body.setFixedRotation(false);
			this.sensorShape.m_vertices = this.rollSensorShape.m_vertices;
		}
		if (this.checkActionState(ActionState.Roll, shouldRoll)) return;

		if (!this.onGround) return;
		this.body?.applyForceToCenter(new Vec2(0, 25 * dt), true);
		this.body?.applyForce(
			new Vec2(this.direction * this.rollForce * dt, 0),
			new Vec2(0, -10),
			true,
		);
	}
	handleDive(dt: number) {
		if (
			this.powerState < PowerState.Big &&
			!this.actionStates.includes(ActionState.Dive)
		)
			return;
		if (this.actionStates.includes(ActionState.GroundPound)) return;
		if (this.actionStates.includes(ActionState.Roll)) return;
		if (this.actionStates.includes(ActionState.Crouch)) return;

		const shouldDive =
			(Actions.hold("dive") && !this.onGround) ||
			(!this.divingDelay.done() &&
				this.actionStates.includes(ActionState.Dive));

		if (!this.actionStates.includes(ActionState.Dive) && shouldDive) {
			this.body.applyForceToCenter(
				new Vec2(this.diveForce * this.direction, 0),
				true,
			);
			this.actionStates.push(ActionState.Locked);
			this.divingDelay.reset();
			this.mainFix.m_friction *= 2;
			this.sensorShape.m_vertices = this.sensorDiveShape.m_vertices;
			this.mainFix.m_shape = this.diveShape;
		}
		if (this.actionStates.includes(ActionState.Dive) && !shouldDive) {
			this.mainFix.m_friction /= 2;
			this.body.applyForceToCenter(new Vec2(0, -250), true);
			this.sensorShape.m_vertices =
				this.powerState < PowerState.Big
					? this.smallSensorShape.m_vertices
					: this.bigSensorShape.m_vertices;
			this.mainFix.m_shape =
				this.powerState < PowerState.Big ? this.smallShape : this.bigShape;
		}

		if (this.checkActionState(ActionState.Dive, shouldDive)) return;
		if (!this.onGround) return;

		this.divingDelay.tick(dt);
		if (!this.divingDelay.done()) return;
		this.actionStates = this.actionStates.filter(
			(v) => v != ActionState.Locked,
		);
	}
	handleGroundPound() {
		if (
			this.powerState < PowerState.Big &&
			!this.actionStates.includes(ActionState.GroundPound)
		)
			return;
		if (this.actionStates.includes(ActionState.Roll)) return;
		if (this.actionStates.includes(ActionState.Crouch)) return;
		if (this.actionStates.includes(ActionState.Dive)) return;
		const shouldGroundPound =
			((Actions.hold("groundpound") && !this.onGround) ||
				(this.actionStates.includes(ActionState.GroundPound) &&
					!this.onGround)) &&
			(!this.groundPoundHit || Actions.hold("groundpound"));
		if (
			shouldGroundPound &&
			!this.actionStates.includes(ActionState.GroundPound)
		) {
			this.sensorShape.m_vertices = this.smallSensorShape.m_vertices;
			this.mainFix.m_shape = this.smallShape;
			this.actionStates.push(ActionState.Locked);
		}
		if (
			!shouldGroundPound &&
			this.actionStates.includes(ActionState.GroundPound)
		) {
			this.sensorShape.m_vertices = this.bigSensorShape.m_vertices;
			this.mainFix.m_shape = this.bigShape;
			this.actionStates = this.actionStates.filter(
				(v) => v != ActionState.Locked,
			);
			this.groundPoundHit = false;
		}
		if (this.checkActionState(ActionState.GroundPound, shouldGroundPound))
			return;

		this.body.setLinearVelocity(new Vec2(0, this.groundpoundSpeed));
	}
	checkMaxVel() {
		const maxVel = this.actionStates.map((v) => {
			if (v == ActionState.Roll) return new Vec2(13.5, -15);
			if (v == ActionState.LongJump) return new Vec2(30, -15);
			if (v == ActionState.Dive) return new Vec2(20, -15);
			if (v == ActionState.Run) return new Vec2(10, -16.5);

			return new Vec2(6, -15);
		});
		const maxX = Math.max(...maxVel.map((v) => v.x), 5);
		const maxY = Math.min(...maxVel.map((v) => v.y), -15);
		this.maxVel.x = maxX;
		this.maxVel.y = maxY;

		const vel = this.body.getLinearVelocity();
		if (vel.y == 0) {
			this.actionStates = this.actionStates.filter(
				(v) => v != ActionState.Jump,
			);
		}
		if (vel.x * this.direction > this.maxVel.x)
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
	handleAnim() {
		const vel = this.body.getLinearVelocity();
		this.anims.small_walk.animationSpeed = 0.05 * vel.x;
		this.anims.big_walk.animationSpeed = 0.05 * vel.x;
		if (vel.x == 0) {
			this.anims.small_walk.currentFrame = 0;
			this.anims.big_walk.currentFrame = 0;
		}
		if (this.actionStates.includes(ActionState.Locked)) {
			if (
				this.actionStates.includes(ActionState.Dive) &&
				this.currentAnim != "dive"
			) {
				this.setAnim("dive");
			} else if (
				this.actionStates.includes(ActionState.GroundPound) &&
				this.currentAnim != "crouch"
			) {
				this.setAnim("crouch");
			}
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
				this.currentAnim != "big_jump" &&
				!this.actionStates.includes(ActionState.Crouch)
			) {
				this.setAnim("big_jump");
			} else if (
				this.actionStates.includes(ActionState.Crouch) &&
				!this.actionStates.includes(ActionState.Roll) &&
				this.currentAnim != "crouch"
			) {
				this.setAnim("crouch");
			} else if (
				this.actionStates.includes(ActionState.Roll) &&
				this.currentAnim != "roll"
			) {
				this.setAnim("roll");
			} else if (
				!this.actionStates.includes(ActionState.Jump) &&
				!this.actionStates.includes(ActionState.Crouch) &&
				!this.actionStates.includes(ActionState.Dive) &&
				this.currentAnim != "big_walk" &&
				this.onGround
			) {
				this.setAnim("big_walk");
			}
		}
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
	setAnim(anim: PlayerAnims) {
		this.anims[this.currentAnim].visible = false;
		this.currentAnim = anim;
		this.anims[anim].x = this.sprite.x;
		this.anims[anim].y = this.sprite.y;
		this.anims[anim].alpha = this.sprite.alpha;
		this.sprite = this.anims[anim];
		this.sprite.visible = true;
	}
	setPState(state: PState, world: World, pause: boolean = true) {
		this.setBigHitbox(state >= PowerState.Big);
		this.actionStates = this.actionStates.filter(
			(v) =>
				v == ActionState.Run || v == ActionState.Walk || v == ActionState.Jump,
		);
		world.pause = pause;
		if (pause) {
			this.dmg = true;
			if (this.powerState > PowerState.Small && state < PowerState.Big) {
				this.setAnim("shrink_anim");
				this.anims.shrink_anim.play();
			}
			if (this.powerState < PowerState.Big && state > PowerState.Small) {
				this.setAnim("grow_anim");
				this.anims.grow_anim.play();
				this.powerUpSound.play();
			}
		}
		this.anims[this.currentAnim].scale.x = this.direction;
		this.powerState = state;
	}
	setBigHitbox(yes: boolean) {
		this.body.setAngle(0);
		this.body.setFixedRotation(true);

		this.density = yes ? 1 : 2;
		if (this.mainFix) this.mainFix.setDensity(this.density);
		this.body.resetMassData();
		this.mainFix.m_shape = yes ? this.bigShape : this.smallShape;
		this.shape = this.mainFix.m_shape;
		this.sensorShape.m_vertices = yes
			? this.bigSensorShape.m_vertices
			: this.smallSensorShape.m_vertices;

		const pos = this.body.getPosition();
		pos.y -= yes ? 0.25 : -0.25;
		this.body.setPosition(new Vec2(pos.x, pos.y));
		this.body.setAwake(true);
		const sprPos = planckToPixi(pos);
		this.sprite.x = sprPos.x;
		this.sprite.y = sprPos.y;
		this.body.resetMassData();
	}
	checkGround(contact: Contact) {
		const fixA = contact.getFixtureA();
		const fixB = contact.getFixtureB();
		if (fixA.isSensor() && fixB.isSensor()) return;
		const userA = fixA.getUserData();
		const userB = fixB.getUserData();

		if (fixA != this.sensor && fixB != this.sensor) return;
		const groundFix = (userA == null ? userB : userA) as PhysObjUserData;
		if (contact.isTouching()) {
			this.touchedGrounds.push(groundFix.id);
		} else {
			this.touchedGrounds = this.touchedGrounds.filter(
				(v) => v != groundFix.id,
			);
		}
	}
	checkInv(contact: Contact) {
		if (this.invTimer.done()) return;
		const fixA = contact.getFixtureA();
		const fixB = contact.getFixtureB();
		const userA = fixA.getUserData() as PhysObjUserData;
		const userB = fixB.getUserData() as PhysObjUserData;
		if (fixA != this.mainFix && fixB != this.mainFix) return;
		if (userA == null || userB == null) return;
		const enemyFix = userA.goid == "player" ? userB : userA;
		if (enemyFix.goid != "koopa" && enemyFix.goid != "goomba") return;
		contact.setEnabled(false);
	}
	get onGround() {
		return this.touchedGrounds.length != 0;
	}
	serialize(): SerializedGO {
		return {
			_type: this.goid,
			data: {
				pos: this.pos,
				pState: this.powerState,
			},
		};
	}
	recheckGround() {
		for (let contact; contact; contact = this.body.getContactList()) {
			this.checkGround(contact.contact);
		}
	}
	static deserialize(obj: SerializedGO): GameObject {
		return new Player(
			new Vec2(obj.data.pos.x, obj.data.pos.y),
			obj.data.pState,
		);
	}
}
