import { SmallButton } from "@lib/ui/small_button";
import { Content } from "@pixi/layout";
import { FancyButton, Input } from "@pixi/ui";
import { Screen } from "@ui/screen";
import { GameObjectID, GOID, PropertyValue, PropType } from "gameObject";
import { Sprite, Text } from "pixi.js";
import { Editor } from ".";
import { getClassFromID } from "gameObject/utils";

export class EditorUi extends Screen {
	topPinned: GameObjectID[] = [
		GOID.Player,
		GOID.Goomba,
		GOID.Koopa,
		GOID.Mushroom,
		GOID.MarkBlock,
		GOID.Brick,
		GOID.Grass,
		GOID.Rock,
		GOID.Ice,
	];
	selected?: GameObjectID;
	dontPlace = false;
	dontInput = false;
	erase = false;
	worldRef: Editor;
	input!: Input;
	levelData?: string;
	propertyValue: PropertyValue[] = [];
	constructor(editor: Editor) {
		super("Editor");
		this.addTopPins();
		this.addProps();
		this.worldRef = editor;
	}
	public addTopPins() {
		this.addContent({
			topPins: {
				content: this.pins,
				styles: {
					position: "centerTop",
					maxWidth: "50%",
					maxHeight: "10%",
					marginTop: 5,
				},
			},
			eraser: {
				content: [
					{
						content: new SmallButton("🔄", () => this.switchLoad()),
						styles: {
							paddingLeft: 5,
						},
					},
					{
						content: new SmallButton("📋", () => this.copy()),
						styles: {
							paddingLeft: 5,
						},
					},
					{
						content: new SmallButton("🗑️", () => this.switchErase()),
						styles: {
							paddingLeft: 5,
						},
					},
				],
				styles: {
					position: "topRight",
					margin: 5,
					maxHeight: "10%",
					maxWidth: "25%",
				},
			},
		});
	}
	public addProps() {
		this.addContent({
			props: {
				content: this.props,
				styles: {
					position: "centerRight",
					margin: 5,
					height: "50%",
					width: "20%",
				},
			},
		});
	}
	switchErase() {
		this.erase = !this.erase;
		this.dontPlace = true;
	}
	switchLoad() {
		navigator.clipboard.readText().then((v) => {
			this.levelData = v;
		});
		this.dontPlace = true;
	}
	copy() {
		this.worldRef.save();
		window.navigator.clipboard.writeText(this.worldRef.data);
		this.dontPlace = true;
	}
	onSelectedPin(goid: GameObjectID) {
		this.selected = goid;
		this.dontPlace = true;
		this.erase = false;

		this.removeChildByID("props");
		this.addProps();
		this.propertyValue = [];
	}
	get props() {
		const propsContent: Content = [];
		if (!this.selected) return propsContent;

		const props = getClassFromID(this.selected).props;

		for (const prop of props) {
			const input = new Input({
				bg: Sprite.from("big_button"),
				textStyle: {
					fill: "white",
					fontSize: 100,
				},
				placeholder: `Input ${prop.name}`,
			});
			input.scale = 0.2;
			const placeholder = input.children.find((v) => {
				if (!(v instanceof Text)) return false;
				return v.text == `Input ${prop.name}`;
			}) as Text;
			input.addEventListener("pointerdown", () => {
				this.dontInput = true;
				this.dontPlace = true;
			});
			input.onEnter.connect((v) => {
				this.dontInput = false;
				switch (prop.type) {
					case PropType.number: {
						const isNumber = !isNaN(Number(v));
						if (isNumber) break;
						placeholder.text = "Invalid number";
						input.value = "";

						return;
					}
					case PropType.goid: {
						if (getClassFromID(v as GameObjectID)) break;
						placeholder.text = "Invalid gameObject";
						input.value = "";

						return;
					}
				}
				const find = this.propertyValue.findIndex((v) => v.name == prop.name);
				if (find == -1) {
					this.propertyValue.push({
						value: v,
						type: prop.type,
						name: prop.name,
					});
				} else {
					this.propertyValue[find].value = v;
				}
			});

			const text = new Text({ text: prop.name });
			propsContent.push({
				content: [
					{
						content: text,
						styles: {
							display: "inline-block",
							maxWidth: "50%",
						},
					},
					{
						content: input,
						styles: {
							maxWidth: "50%",
							display: "inline-block",
						},
					},
				],
				styles: {
					display: "block",
				},
			});
		}

		return propsContent;
	}
	get pins() {
		const pins: Content = [];
		const amt = 10;
		for (let i = 0; i < amt; i++) {
			const icon = this.topPinned[i]
				? Sprite.from(this.topPinned[i] + "_pin")
				: undefined;
			const btn = new FancyButton({
				defaultView: "editor_pin",
				icon,
				defaultIconScale: 5,
			});
			btn.onPress.connect(() => this.onSelectedPin(this.topPinned[i]));
			pins.push({
				content: btn,
				styles: {
					paddingRight: 15,
				},
			});
		}
		return pins;
	}
}
