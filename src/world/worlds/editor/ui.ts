import { SmallButton } from "@lib/ui/small_button";
import { Content } from "@pixi/layout";
import { FancyButton } from "@pixi/ui";
import { Screen } from "@ui/screen";
import { GameObjectID, GOID } from "gameObject";
import { Sprite, Text } from "pixi.js";
import { Editor } from ".";

export class EditorUi extends Screen {
	topPinned: GameObjectID[] = [GOID.Player, GOID.Ground];
	selected?: GameObjectID;
	dontPlace = false;
	erase = false;
	worldRef: Editor;
	constructor(editor: Editor) {
		super("Editor");
		this.addTopPins();
		this.worldRef = editor;
	}
	public addTopPins() {
		this.addContent({
			topPins: {
				content: this.pins,
				styles: {
					position: "centerTop",
					maxWidth: "80%",
					maxHeight: "10%",
					marginTop: 5,
				},
			},
			eraser: {
				content: [
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
				},
			},
		});
	}
	switchErase() {
		this.erase = !this.erase;
		this.dontPlace = true;
	}
	copy() {
		this.worldRef.save();
		window.navigator.clipboard.writeText(this.worldRef.data);
		this.dontPlace = true;
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
			btn.onPress.connect(() => {
				this.selected = this.topPinned[i];
				this.dontPlace = true;
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
}
