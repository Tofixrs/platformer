import { FancyButton } from "@pixi/ui";
import { Screen } from "@ui/screen";
import { GameObjectID } from "gameObject";
import { Sprite } from "pixi.js";

export class EditorUi extends Screen {
	topPinned: GameObjectID[] = [GameObjectID.Player, GameObjectID.Ground];
	selected?: GameObjectID;
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
		});
	}
	get pins() {
		const pins: FancyButton[] = [];
		const amt = 10;
		for (let i = 0; i < amt; i++) {
			const icon = this.topPinned[i]
				? Sprite.from(this.topPinned[i] + "_pin")
				: undefined;
			const btn = new FancyButton({
				defaultView: "pin",
				icon,
				defaultIconScale: 5,
			});
			btn.onPress.connect(() => {
				this.selected = this.topPinned[i];
			});
			pins.push(btn);
		}
		return pins;
	}
}
