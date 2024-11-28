import { Screen } from "@lib/ui/screen";
import { Text, TextStyle } from "pixi.js";

export class CampaignUi extends Screen {
	livesText = new Text({
		text: "❤️3",
		style: new TextStyle({
			fontSize: 50,
		}),
	});
	constructor() {
		super("campaign");
		this.addTop();
	}
	addTop() {
		this.addContent({
			topBar: {
				content: {
					liveCounter: {
						content: this.livesText,
					},
				},
				styles: {
					position: "centerTop",
					width: "100%",
					maxHeight: "10%",
				},
			},
		});
	}
	set lives(lives: number) {
		this.livesText.text = "❤️" + lives.toString();
	}
}
