import { SmallButton } from "@lib/ui/small_button";
import { FancyButton } from "@pixi/ui";
import { Screen } from "@ui/screen";
import { GameObjectID, GOID } from "gameObject";
import { Sprite } from "pixi.js";

export class EditorUi extends Screen {
	topPinned: GameObjectID[] = [GOID.Player, GOID.Ground];
	selected?: GameObjectID;
	dontPlace = false;
	erase = false;
	constructor() {
		super("Editor");
		this.addTopPins();
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
				content: new SmallButton("🗑️", () => this.switchErase()),
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
	get pins() {
		const pins: FancyButton[] = [];
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
			pins.push(btn);
		}
		return pins;
	}
}
