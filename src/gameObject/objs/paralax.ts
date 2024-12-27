import { SerializedGO } from "@lib/serialize";
import { GameObject, GOID, Property, PropertyValue } from "gameObject";
import { ObservablePoint, Texture, TilingSprite } from "pixi.js";
import { Body, Box, Shape, Vec2, Vec3 } from "planck";
import { World } from "world";

export const Backgrounds = {
	Normal: 1,
	Cave: 2,
	Settings: 3,
} as const;
export type Background = (typeof Backgrounds)[keyof typeof Backgrounds];
export class Paralax extends GameObject {
	background: Background = Backgrounds.Normal;
	static maxInstances?: number | undefined = 1;
	bg: TilingSprite;
	fg: TilingSprite;
	body!: Body; //only to display hitbox so you can delete
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
	];
	constructor(background?: Background, pos?: Vec2) {
		super({
			pos: pos || Vec2.zero(),
			goid: GOID.Paralax,
			shape: new Box(1, 1),
		});
		this.background = background || this.background;
		this.bg = new TilingSprite({
			texture: Texture.from(this.backgrounds[this.background].bg),
			width: 192000,
			height: 1080,
			zIndex: -12,
			label: "bg",
		});
		this.fg = new TilingSprite({
			texture: Texture.from(this.backgrounds[this.background].fg),
			width: 192000,
			height: 1080,
			zIndex: -11,
			label: "fg",
		});
	}
	update(_dt: number, world: World): void {
		super.update(_dt, world);
		this.updatePos(world.main.pivot);
	}
	updatePos(pivot: ObservablePoint) {
		this.fg.pivot.x = pivot.x / 5;
		this.bg.pivot.x = pivot.x / 10;
	}
	create(world: World): void {
		world.bottom.addChild(this.bg);
		world.bottom.addChild(this.fg);
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
	}
	remove(world: World, _force?: boolean): boolean {
		world.bottom.removeChild(this.bg);
		world.bottom.removeChild(this.fg);
		world.p.destroyBody(this.body);
		return true;
	}
	serialize(): SerializedGO {
		return {
			_type: this.goid,
			data: this.background,
		};
	}
	static deserialize(_obj: SerializedGO): GameObject {
		return new Paralax(_obj.data);
	}
	static commonConstructor(
		pos: Vec2,
		_shape: Shape,
		_startPos: Vec2,
		_currPos: Vec2,
		props?: PropertyValue[],
	): GameObject {
		const bg = props?.find((v) => v.name == "paralaxbBg");
		return new Paralax(Number(bg?.value) as Background, pos);
	}
}
