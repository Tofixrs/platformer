import { SerializedGO } from "@lib/serialize";
import { GameObject, GOID, Property, PropertyValue } from "gameObject";
import { Texture, TilingSprite } from "pixi.js";
import { Box, Shape, Vec2 } from "planck-js";
import { World } from "world";

const Backgrounds = {
	Normal: 1,
	Cave: 2,
} as const;
type Background = (typeof Backgrounds)[keyof typeof Backgrounds];
export class Paralax extends GameObject {
	background: Background = Backgrounds.Normal;
	static maxInstances?: number | undefined = 1;
	bg: TilingSprite;
	fg: TilingSprite;
	backgrounds: Record<Background, { bg: string; fg: string }> = {
		[Backgrounds.Normal]: {
			bg: "normal_bg",
			fg: "normal_fg",
		},
		[Backgrounds.Cave]: {
			bg: "normal_bg",
			fg: "normal_fg",
		},
	};
	static props: Property[] = [
		{
			name: "background",
			type: "number",
			defaultValue: "1",
		},
	];
	constructor(background?: Background) {
		super({
			pos: Vec2.zero(),
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
		this.fg.pivot.x = world.main.pivot.x / 5;
		this.bg.pivot.x = world.main.pivot.x / 10;
	}
	create(world: World): void {
		world.bottom.addChild(this.bg);
		world.bottom.addChild(this.fg);
	}
	remove(world: World, _force?: boolean): boolean {
		world.bottom.removeChild(this.bg);
		world.bottom.removeChild(this.fg);
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
		_pos: Vec2,
		_shape: Shape,
		_startPos: Vec2,
		_currPos: Vec2,
		props?: PropertyValue[],
	): GameObject {
		const bg = props?.find((v) => v.name == "background");
		return new Paralax(Number(bg?.value) as Background);
	}
}
