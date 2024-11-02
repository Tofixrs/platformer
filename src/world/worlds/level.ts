import { deserializeWorld } from "@lib/serialize";
import { Screen } from "@lib/ui/screen";
import { Input } from "@pixi/ui";
import { Graphics } from "graphics";
import { Rectangle, Sprite } from "pixi.js";
import { World } from "world";

export class Level extends World {
	ui: LevelUi = new LevelUi();
	constructor(graphics: Graphics, data?: string) {
		super(graphics);
		if (data) {
			this.load(data);
		}
		this.top.addChild(this.ui);
		this.recenter(graphics.renderer.screen);
	}
	update(dt: number): void {
		super.update(dt);
		if (this.ui.data != "") {
			this.ui.visible = false;
			this.load(this.ui.data);
			this.ui.data = "";
		}
	}

	load(data: string) {
		for (let i = this.entities.length - 1; i != -1; i--) {
			this.removeEntity(this.entities[i], i);
		}
		const ent = deserializeWorld(data);
		ent.forEach((v) => this.addEntity(v));
	}
	recenter(screen: Rectangle): void {
		this.ui.resize(screen.width, screen.height);
	}
}

class LevelUi extends Screen {
	data = "";
	input!: Input;
	constructor() {
		super("LevelUi");
		this.addInput();
		window.addEventListener("paste", (ev) => {
			ev.preventDefault();
			this.input.value = ev.clipboardData?.getData("text")!;
		});
	}
	addInput() {
		this.input = new Input({
			bg: Sprite.from("big_button"),
			textStyle: {
				fill: "white",
			},
			placeholder: "Input level data",
		});
		this.input.onEnter.connect((t) => (this.data = t));
		this.addContent({
			input: {
				content: this.input,
				styles: {
					position: "center",
				},
			},
		});
	}
}
