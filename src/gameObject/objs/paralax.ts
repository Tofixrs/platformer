import { SerializedGO } from "@lib/serialize";
import { GameObject, GOID, Property, PropertyValue } from "gameObject";
import { ObservablePoint, Texture, TilingSprite } from "pixi.js";
import { Body, Box, Shape, Vec2 } from "planck";
import { World } from "world";

export const Backgrounds = {
	Normal: 1,
	Cave: 2,
	Settings: 3,
} as const;
export type Background = (typeof Backgrounds)[keyof typeof Backgrounds];
export class Paralax extends GameObject {
	background: Background = Backgrounds.Normal;
	bg: TilingSprite;
	fg: TilingSprite;
	body!: Body; //only to display hitbox so you can delete
	visibility?: Vec2;
	backgrounds: Record<Background, { bg: string; fg: string }> = {
		[Backgrounds.Normal]: {
			bg: "normal_bg",
			fg: "normal_fg",
		},
		[Backgrounds.Cave]: {
			bg: "cave_bg",
			fg: "cave_fg",
		},
		[Backgrounds.Settings]: {
			bg: "settings_bg",
			fg: "settings_fg",
		},
	};
	static props: Property[] = [
		{
			name: "paralaxBg",
			type: "number",
			defaultValue: "1",
			descriptionKey: "paralaxDesc",
		},
		{
			name: "visibilityX",
			type: "number",
			defaultValue: "",
			descriptionKey: "visibilityDesc",
		},
		{
			name: "visibilityY",
			type: "number",
			defaultValue: "",
			descriptionKey: "visibilityDesc",
		},
	];
	constructor(pos: Vec2, background?: Background, visibility?: Vec2) {
		super({
			pos: pos || Vec2.zero(),
			goid: GOID.Paralax,
			shape: new Box(1, 1),
		});
		this.visibility = visibility;
		this.background = background || this.background;
		this.bg = new TilingSprite({
			texture: Texture.from(this.backgrounds[this.background].bg),
			width: 384000,
			height: 1080,
			zIndex: -12,
			x: -192000,
			label: "bg",
		});
		this.fg = new TilingSprite({
			texture: Texture.from(this.backgrounds[this.background].fg),
			width: 384000,
			height: 1080,
			zIndex: -11,
			x: -192000,
			label: "fg",
		});
	}
	update(_dt: number, world: World): void {
		super.update(_dt, world);
		this.updatePos(world.main.pivot);
		this.checkVisible(world.main.pivot);
	}
	pausedUpdate(_dt: number, world: World): void {
		this.checkVisible(world.main.pivot);
	}
	updatePos(pivot: ObservablePoint) {
		this.fg.pivot.x = pivot.x / 5;
		this.bg.pivot.x = pivot.x / 10;
	}
	create(world: World): void {
		world.bottom.addChild(this.bg);
		world.bottom.addChild(this.fg);
		const count = world.entities.filter((v) => v.goid == GOID.Paralax).length;
		this.bg.zIndex = -2138 + 2 * count;
		this.fg.zIndex = -2137 + 2 * count;
		this.body = world.p.createBody({
			position: this.pos,
			fixedRotation: true,
			type: "static",
		});

		this.body.createFixture({
			density: 0,
			shape: this.shape,
			friction: 0,
			isSensor: true,
			userData: {
				goid: this.goid,
				id: this.id,
			},
		});
		this.checkVisible(world.main.pivot);
	}
	checkVisible(pivot: ObservablePoint) {
		if (!this.visibility) return;
		const visible = pivot.x > this.visibility.x && pivot.y > this.visibility.y;
		if (this.bg.visible != visible) {
			this.updatePos(pivot);
		}
		this.bg.visible = visible;
		this.fg.visible = visible;
	}
	remove(world: World, _force?: boolean): boolean {
		world.bottom.removeChild(this.bg);
		world.bottom.removeChild(this.fg);
		world.p.queueUpdate(() => {
			world.p.destroyBody(this.body);
		});
		return true;
	}
	serialize(): SerializedGO {
		return {
			_type: this.goid,
			data: {
				bg: this.background,
				pos: this.pos,
				visibility: this.visibility,
			},
		};
	}
	static deserialize(obj: SerializedGO): GameObject {
		const pos = new Vec2(obj.data.pos.x, obj.data.pos.y);
		const visibility = obj.data.visibility
			? new Vec2(obj.data.visibility.x, obj.data.visibility.y)
			: undefined;
		return new Paralax(pos, obj.data.bg, visibility);
	}
	static commonConstructor(
		pos: Vec2,
		_shape: Shape,
		_startPos: Vec2,
		_currPos: Vec2,
		props?: PropertyValue[],
	): GameObject {
		const bg = props?.find((v) => v.name == "paralaxBg");
		const visibilityX = props?.find((v) => v.name == "visibilityX")?.value;
		const visibilityY = props?.find((v) => v.name == "visibilityY")?.value;
		const visibility =
			visibilityX || visibilityY
				? new Vec2(
						Number(visibilityX ?? Number.MIN_VALUE),
						Number(visibilityY ?? Number.MIN_VALUE),
					)
				: undefined;
		return new Paralax(pos, Number(bg?.value) as Background, visibility);
	}
}
