import { Content, Layout } from "@pixi/layout";
import { CheckBox, Input, ScrollBox } from "@pixi/ui";
import { Screen } from "@ui/screen";
import { GameObjectID, GOID, PropertyValue } from "gameObject";
import { Container, Sprite, Text, Texture } from "pixi.js";
import { Editor } from ".";
import { getClassFromID, validateProp } from "gameObject/utils";
import { Storage } from "@lib/storage";
import { Window } from "@lib/ui/Window";
import { SmallButton } from "@lib/ui/small_button";
import i18next from "i18next";
import { Actions } from "@lib/input";
import { Tooltip } from "@lib/ui/tooltip";

export class EditorUi extends Screen {
	selected?: GameObjectID;
	dontPlace = false;
	erase = false;
	worldRef: Editor;
	input!: Input;
	levelData?: string;
	propertyValue: PropertyValue[] = [];
	pinWindow = new PinWindow(this);
	trashButton: SmallButton;
	constructor(editor: Editor) {
		super("Editor");
		this.trashButton = new SmallButton({
			text: "🗑️",
			tooltipOptions: {
				text: i18next.t("erase"),
			},
			hoverContainer: this,
			onClick: () => {
				this.switchErase();
			},
		});
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
									tooltipOptions: {
										text: i18next.t("moreGOS"),
									},
									hoverContainer: this,
									onClick: (self) => {
										self.tooltip!.visible = false;
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
									tooltipOptions: {
										text: i18next.t("levelLoad"),
									},
									hoverContainer: this,
									onClick: (self) => {
										self.tooltip!.visible = false;
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
									tooltipOptions: {
										text: i18next.t("copyLevel"),
									},
									hoverContainer: this,
									onClick: (self) => {
										this.copy();
										self.tooltip!.text.text = i18next.t("copied");
										setTimeout(() => {
											self.tooltip!.text.text = i18next.t("copyLevel");
										}, 2000);
									},
								}),
								styles: {
									paddingLeft: 5,
								},
							},
							{
								content: this.trashButton,
								styles: {
									paddingLeft: 5,
								},
							},
							{
								content: new SmallButton({
									text: "❌",
									tooltipOptions: {
										text: i18next.t("back"),
									},
									hoverContainer: this,
									onClick: (self) => {
										self.tooltip!.visible = false;
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
					marginRight: 150,
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
		this.trashButton.setActive(!this.trashButton.forceActive);
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
		const propsContent: Layout[] = [];
		if (!this.selected) return propsContent;

		const props = getClassFromID(this.selected).props;

		for (const prop of props) {
			if (prop.hide) continue;
			const text = new Text({ text: i18next.t(prop.name) });
			const l = new Layout({ styles: { width: "100%", height: 60 } });
			propsContent.push(l);

			if (prop.descriptionKey) {
				const tooltip = new Tooltip({
					text: i18next.t(prop.descriptionKey),
				});
				this.addChild(tooltip);

				l.eventMode = "dynamic";

				l.addEventListener("mouseenter", () => {
					tooltip.visible = true;
				});
				l.addEventListener("pointerout", () => {
					tooltip.visible = false;
				});
			}
			const defaultPlaceholder = i18next.t("input", {
				type: i18next.t(prop.type),
			});
			if (prop.type != "boolean") {
				const input = new Input({
					bg: "input",
					textStyle: {
						fill: "white",
						fontSize: 20,
					},
					nineSliceSprite: [160, 27, 160, 27],
					placeholder: defaultPlaceholder,
					addMask: true,
					value: prop.defaultValue,
				});
				const placeholder = input.children.find((v) => {
					if (!(v instanceof Text)) return false;
					return v.text == defaultPlaceholder;
				}) as Text;
				input.addEventListener("pointerdown", () => {
					Actions.lock = true;
					this.dontPlace = true;
				});
				input.onEnter.connect((v) => {
					Actions.lock = false;
					if (!validateProp({ value: v, type: prop.type, name: prop.name })) {
						input.value = "";
						placeholder.text = "Invalid input";

						setTimeout(() => {
							placeholder.text = defaultPlaceholder;
						}, 2000);
						return;
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
				l.addContent({
					text: {
						content: text,
						styles: {
							position: "centerLeft",
							maxWidth: "50%",
						},
					},
					input: {
						content: input,
						styles: {
							position: "centerRight",
							width: "50%",
						},
					},
				});
			} else {
				const checkbox = new CheckBox({
					style: {
						unchecked: "editor_pin",
						checked: "checkbox_on",
					},
				});
				checkbox.onCheck.connect((checked) => {
					this.dontPlace = true;
					const find = this.propertyValue.findIndex((v) => v.name == prop.name);
					if (find == -1) {
						this.propertyValue.push({
							value: String(checked),
							type: prop.type,
							name: prop.name,
						});
					} else {
						this.propertyValue[find].value = String(checked);
					}
				});
				l.addContent({
					text: {
						content: text,
						styles: {
							position: "centerLeft",
							maxWidth: "50%",
						},
					},
					input: {
						content: checkbox,
						styles: {
							position: "centerRight",
							width: "50%",
							maxHeight: "100%",
						},
					},
				});
			}
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
				tooltipOptions: {
					text:
						i18next.t(this.pinWindow.topPinned[i]) +
						` (ID: ${this.pinWindow.topPinned[i]})`,
				},
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
			GOID.Spike,
			GOID.Coin,
			GOID.Pipe,
			GOID.MarkBlock,
			GOID.Brick,
			GOID.Rock,
			GOID.Flag,
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
				tooltipOptions: {
					text: i18next.t(pin.pins[i]) + ` (ID: ${pin.pins[i]})`,
				},
				hoverContainer: pin.editorUiRef,
				hoverView: null,
				defaultView: "editor_pin",
				onClick: (self) => {
					self.tooltip!.visible = false;
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
				tooltipOptions: {
					text: i18next.t(v) + ` (ID: ${v})`,
				},
				hoverContainer: editorUiRef,
				defaultIconScale: 5,
				scale: 0.5,
				onClick: (self) => {
					if (!this.selectedPin) {
						this.editorUiRef.onSelectedPin(v);
						const pinWindow = this.editorUiRef.getChildByID("pinWindow");
						pinWindow!.visible = false;
						self.tooltip!.visible = false;
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
		pBtn.tooltip!.text.text =
			i18next.t(this._topPinned[this.selectedPin!]) +
			` (ID: ${this._topPinned[this.selectedPin!]})`;
		p2Btn.tooltip!.text.text =
			i18next.t(this._topPinned[this.selectedPin!]) +
			` (ID: ${this._topPinned[this.selectedPin!]})`;
		(p2Btn.iconView as Sprite).texture = Texture.from(
			this._topPinned[this.selectedPin!] + "_pin",
		);
		pBtn.tooltip?.refresh();
		p2Btn.tooltip?.refresh();
	}
}
