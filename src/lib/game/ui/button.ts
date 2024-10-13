import { ButtonContainer } from "@pixi/ui";
import { ColorSource, Graphics, Text, TextStyle } from "pixi.js";
import { ContactEdge, Vec2 } from "planck-js";

interface ButtonOptions {
	size: Vec2;
	enabled?: boolean;
	content: string;
	borderColor?: ColorSource;
	color?: ColorSource;
	borderRadius?: number;
}

export const Button = ({
	size,
	enabled,
	color,
	content,
	borderColor,
	borderRadius,
}: ButtonOptions) => {
	const button = new ButtonContainer();
	button.enabled = enabled || true;
	const graphics = new Graphics()
		.roundRect(-1 - size.x / 2, -1, size.x + 2, size.y + 2, borderRadius || 50)
		.stroke({ color: borderColor || 0x000000, width: 2 })
		.roundRect(-size.x / 2, 0, size.x, size.y, borderRadius || 50)
		.fill({ color: color || 0xffffff });
	const text = new Text({
		text: content,
		style: new TextStyle({ fontSize: 50 }),
	});
	text.anchor.set(0.5);
	text.y = size.y / 2;

	button.addChild(graphics);
	button.addChild(text);

	return button;
};
