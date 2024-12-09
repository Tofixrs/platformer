import { Content } from "@pixi/layout";
import { Input, ScrollBox } from "@pixi/ui";
import { Screen } from "@ui/screen";
import { GameObjectID, GOID, PropertyValue, PropType } from "gameObject";
import { Sprite, Text, Texture } from "pixi.js";
import { Editor } from ".";
import { getClassFromID } from "gameObject/utils";
import { Storage } from "@lib/storage";
import { Window } from "@lib/ui/Window";
import { SmallButton } from "@lib/ui/small_button";
import i18next from "i18next";

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
		this.worldRef = editor;
		this.addTop();
		this.addProps();
		this.addPinWindow();
	}
	public addTop() {
		this.addContent({
			top: {
				content: {
					topPinned: {
						content: [
							...this.pins,
							{
								content: new SmallButton({
									text: "⬇️",
									hoverText: i18next.t("moreGOS"),
									hoverContainer: this,
									onClick: (self) => {
										self.hover.visible = false;
										this.switchPinWindow();
									},
								}),
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
								content: new SmallButton({
									text: "🔄",
									hoverText: i18next.t("levelLoad"),
									hoverContainer: this,
									onClick: (self) => {
										self.hover.visible = false;
										this.switchLoad();
									},
								}),
								styles: {
									paddingLeft: 5,
								},
							},
							{
								content: new SmallButton({
									text: "📋",
									hoverText: i18next.t("copyLevel"),
									hoverContainer: this,
									onClick: (self) => {
										this.copy();
										self.hoverText.text = "Copied!";
										setTimeout(() => {
											self.hoverText.text = "Copy level data";
										}, 2000);
									},
								}),
								styles: {
									paddingLeft: 5,
								},
							},
							{
								content: new SmallButton({
									text: "🗑️",
									hoverText: i18next.t("erase"),
									hoverContainer: this,
									onClick: () => {
										this.switchErase();
									},
								}),
								styles: {
									paddingLeft: 5,
								},
							},
							{
								content: new SmallButton({
									text: "❌",
									hoverText: i18next.t("back"),
									hoverContainer: this,
									onClick: (self) => {
										self.hover.visible = false;
										this.worldRef.worldControllerRef.set("mainMenu");
									},
								}),
								styles: {
									paddingLeft: 5,
									paddingRight: 10,
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
					maxHeight: "10%",
					marginTop: 5,
					marginRight: 5,
					marginLeft: 5,
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
					case PropType.boolean: {
						const valid = v == "true" || v == "false" || v == "1" || v == "0";
						if (valid) break;
						placeholder.text = "Invalid format";
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
			const btn = new SmallButton({
				defaultView: "editor_pin",
				hoverView: null,
				icon,
				defaultIconScale: 5,
				hoverText: i18next.t(this.pinWindow.topPinned[i]),
				hoverContainer: this,
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

class PinWindow extends Window<{
	pins: GameObjectID[];
	editorUiRef: EditorUi;
}> {
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

		super({ title: "pins", data: { pins: topPinned, editorUiRef } });
		this._topPinned = topPinned;
		this.editorUiRef = editorUiRef;
	}
	createContent(data: {
		pins: GameObjectID[];
		editorUiRef: EditorUi;
	}): Content {
		return {
			levels: {
				content: new ScrollBox({
					width: 850,
					height: 550,
					radius: 70,
					horPadding: 60,
					elementsMargin: 20,
					items: this.objs(data.editorUiRef),
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
		};
	}
	pins(pin: { pins: GameObjectID[]; editorUiRef: EditorUi }) {
		const pins: Content = [];
		const amt = 10;
		for (let i = 0; i < amt; i++) {
			const icon = Sprite.from(pin.pins[i] + "_pin");
			const btn = new SmallButton({
				icon,
				defaultIconScale: 5,
				hoverText: i18next.t(pin.pins[i]),
				hoverContainer: pin.editorUiRef,
				hoverView: null,
				defaultView: "editor_pin",
				onClick: (self) => {
					self.hover.visible = false;
					self.setActive(true);
					this.selectedPin = i;
				},
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
	objs(editorUiRef: EditorUi) {
		return Object.values(GOID).map((v) => {
			const btn = new SmallButton({
				defaultView: "editor_pin",
				hoverView: null,
				icon: Sprite.from(`${v}_pin`),
				hoverText: i18next.t(v),
				hoverContainer: editorUiRef,
				defaultIconScale: 5,
				scale: 0.5,
				onClick: (self) => {
					if (!this.selectedPin) {
						this.editorUiRef.onSelectedPin(v);
						const pinWindow = this.editorUiRef.getChildByID("pinWindow");
						pinWindow!.visible = false;
						self.hover.visible = false;
						return;
					}

					const pinned = this.topPinned;
					pinned[this.selectedPin] = v;
					this.topPinned = pinned;
					this.selectedPin = undefined;
				},
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
		const pBtn = p.children[this.selectedPin!].children[0] as SmallButton;
		const p2Btn = p2.children[this.selectedPin!].children[0] as SmallButton;
		(pBtn.iconView as Sprite).texture = Texture.from(
			this._topPinned[this.selectedPin!] + "_pin",
		);

		p2Btn.setActive(false);
		pBtn.hoverText.text = i18next.t(this._topPinned[this.selectedPin!]);
		p2Btn.hoverText.text = i18next.t(this._topPinned[this.selectedPin!]);
		(p2Btn.iconView as Sprite).texture = Texture.from(
			this._topPinned[this.selectedPin!] + "_pin",
		);
	}
}
