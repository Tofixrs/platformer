import { SerializedGO } from "@lib/serialize";
import { Container } from "pixi.js";
import { Shape, Vec2 } from "planck";
import { World } from "world";

export interface GameObjectOptions {
	pos: Vec2;
	shape: Shape;
	goid: GameObjectID;
}

export const PropType = {
	number: "number",
	goid: "goid",
	boolean: "boolean",
	string: "string",
} as const;

export type PType = (typeof PropType)[keyof typeof PropType];

export interface Property {
	name: string;
	type: PType;
	defaultValue: string; //yes im gonna have to parse those pain
	descriptionKey?: string;
	hide?: boolean;
}
export interface PropertyValue {
	name: string;
	type: PType;
	value: string;
}

export abstract class GameObject {
	static draggable = false;
	static maxInstances?: number;
	static props: Property[] = [];
	pos: Vec2;
	shape: Shape;
	goid: GameObjectID;
	id: string;
	constructor({ pos, shape, goid: id }: GameObjectOptions) {
		this.pos = pos;
		this.shape = shape;
		this.goid = id;
		this.id = window.crypto.randomUUID();
	}
	update(_dt: number, _world: World) {}
	pausedUpdate(_dt: number, _world: World) {}
	fixedUpdate() {}
	create(_world: World) {}
	remove(
		_world: World,
		_force: boolean = false,
		_anim: boolean = false,
	): boolean {
		return true;
	}
	static renderDrag(_startPos: Vec2, _currPos: Vec2, _container: Container) {}
	static commonConstructor(
		_pos: Vec2,
		_shape: Shape,
		_startPos: Vec2,
		_currPos: Vec2,
		_props?: PropertyValue[],
	): GameObject {
		return null as unknown as GameObject;
	}
	static deserialize(_obj: SerializedGO): GameObject {
		return null as unknown as GameObject;
	}
	serialize(): SerializedGO {
		return null as unknown as SerializedGO;
	}
}

export const GOID = {
	Player: "player",
	Grass: "grass",
	Ice: "ice",
	Goomba: "goomba",
	Koopa: "koopa",
	Brick: "brick",
	Mushroom: "mushroom",
	MarkBlock: "markBlock",
	Rock: "rock",
	DeathPlane: "deathPlane",
	Flag: "flag",
	Paralax: "paralax",
	OneUp: "1up",
	Coin: "coin",
	Spike: "spike",
	Sushroom: "sushroom",
	Pipe: "pipe",
	CameraWall: "cameraWall",
} as const;

type GOIOKeys = keyof typeof GOID;
export type GameObjectID = (typeof GOID)[GOIOKeys];
