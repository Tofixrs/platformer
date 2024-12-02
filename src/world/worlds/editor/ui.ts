import { SmallButton } from "@lib/ui/small_button";
import { Content, Layout } from "@pixi/layout";
import { FancyButton, Input, ScrollBox } from "@pixi/ui";
import { Screen } from "@ui/screen";
import { GameObjectID, GOID, PropertyValue, PropType } from "gameObject";
import { Sprite, Text, Texture } from "pixi.js";
import { Editor } from ".";
import { getClassFromID } from "gameObject/utils";
import { Storage } from "@lib/storage";
import { Window } from "@lib/ui/Window";

export class EditorUi extends Screen {
	selected?: GameObjectID;
	dontPlace = false;
	dontInput = false;
	erase = false;
	worldRef: Editor;
	input!: Input;
	levelData?: string;
	propertyValue: PropertyValue[] = [];
	pinWindow = new PinWindow(this);
	constructor(editor: Editor) {
		super("Editor");
		this.addTop();
		this.addProps();
		this.addPinWindow();
		this.worldRef = editor;
	}
	public addTop() {
		const pinWindowButton = new FancyButton({
			defaultView: "small_button",
			text: "⬇️",
			defaultTextScale: 5,
		});
		pinWindowButton.addEventListener("pointerdown", () =>
			this.switchPinWindow(),
		);
		this.addContent({
			top: {
				content: {
					topPinned: {
						content: [
							...this.pins,
							{
								content: pinWindowButton,
								styles: {
									paddingRight: 15,
								},
							},
						],
						styles: {
							position: "centerTop",
							maxWidth: "50%",
						},
					},
					right: {
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
							position: "right",
							height: "100%",
						},
					},
				},
				styles: {
					position: "centerTop",
					width: "100%",
					maxHeight: "30%",
					marginTop: 5,
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
	public addPinWindow() {
		this.addContent({
			pinWindow: {
				content: this.pinWindow,
				styles: {
					height: "100%",
					width: "100%",
					visible: false,
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
	switchPinWindow() {
		const pinWindow = this.getChildByID("pinWindow");
		pinWindow!.visible = !pinWindow?.visible;
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
			const icon = this.pinWindow.topPinned[i]
				? Sprite.from(this.pinWindow.topPinned[i] + "_pin")
				: undefined;
			const btn = new FancyButton({
				defaultView: "editor_pin",
				icon,
				defaultIconScale: 5,
			});
			btn.onPress.connect(() =>
				this.onSelectedPin(this.pinWindow.topPinned[i]),
			);
			btn.label = "pin";
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

class PinWindow extends Window<GameObjectID[]> {
	private _topPinned: GameObjectID[];
	private editorUiRef: EditorUi;
	private selectedPin?: number;
	constructor(editorUiRef: EditorUi) {
		const topPinned = Storage.getObj("pins", [
			GOID.Player,
			GOID.Goomba,
			GOID.Koopa,
			GOID.Mushroom,
			GOID.MarkBlock,
			GOID.Brick,
			GOID.Grass,
			GOID.Rock,
			GOID.Ice,
			GOID.DeathPlane,
		]);

		super({ title: "pins", data: topPinned });
		this._topPinned = topPinned;
		this.editorUiRef = editorUiRef;
	}
	createContent(data: GameObjectID[]): Content {
		return {
			levels: {
				content: new ScrollBox({
					width: 850,
					height: 550,
					radius: 70,
					horPadding: 60,
					elementsMargin: 20,
					items: this.objs,
				}),
				styles: {
					position: "center",
					marginTop: 50,
				},
			},
			pins: {
				content: this.pins(data),
				styles: {
					position: "centerTop",
					maxWidth: "80%",
					marginTop: 80,
				},
			},
			styles: {
				position: "center",
			},
		};
	}
	pins(pin: GameObjectID[]) {
		const pins: Content = [];
		const amt = 10;
		for (let i = 0; i < amt; i++) {
			const icon = Sprite.from(pin[i] + "_pin");
			const btn = new FancyButton({
				defaultView: "editor_pin",
				icon,
				defaultIconScale: 5,
			});
			btn.addEventListener("pointerdown", () => {
				this.selectedPin = i;
			});
			pins.push({
				content: btn,
				styles: {
					paddingRight: 15,
				},
			});
		}
		return pins;
	}
	get objs() {
		return Object.values(GOID).map((v) => {
			const btn = new FancyButton({
				defaultView: "editor_pin",
				icon: Sprite.from(v + "_pin"),
				defaultIconScale: 5,
				scale: 0.5,
			});
			btn.addEventListener("pointerdown", () => {
				if (!this.selectedPin) {
					this.editorUiRef.onSelectedPin(v);
					const pinWindow = this.editorUiRef.getChildByID("pinWindow");
					pinWindow!.visible = false;
					return;
				}

				const pinned = this.topPinned;
				pinned[this.selectedPin] = v;
				this.topPinned = pinned;
				this.selectedPin = undefined;
			});
			return btn;
		});
	}
	get topPinned() {
		return this._topPinned;
	}
	set topPinned(pins: GameObjectID[]) {
		this._topPinned = pins;
		Storage.saveObj("pins", this._topPinned);
		const p = this.editorUiRef.getChildByID("topPinned")!;
		const p2 = this.getChildByID("pins")!;
		(
			(p.children[this.selectedPin!].children[0] as FancyButton)
				.iconView as Sprite
		).texture = Texture.from(this._topPinned[this.selectedPin!] + "_pin");

		(
			(p2.children[this.selectedPin!].children[0] as FancyButton)
				.iconView as Sprite
		).texture = Texture.from(this._topPinned[this.selectedPin!] + "_pin");
	}
}
