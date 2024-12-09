import { Screen } from "@lib/ui/screen";
import { Text, TextStyle } from "pixi.js";

export class CampaignUi extends Screen {
	livesText = new Text({
		text: "❤️ 3",
		style: new TextStyle({
			fontSize: 50,
			dropShadow: true,
			fill: "#DDDDDD",
		}),
	});
	coinsText = new Text({
		text: "🪙 0",
		style: new TextStyle({
			fontSize: 50,
			dropShadow: true,
			fill: "#DDDDDD",
		}),
	});
	timeText = new Text({
		text: "🕒 0:00",
		style: new TextStyle({
			fontSize: 50,
			dropShadow: true,
			fill: "#DDDDDD",
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
						styles: {
							paddingLeft: 50,
							paddingRight: 50,
						},
					},
					coins: {
						content: this.coinsText,
						styles: {
							paddingLeft: 50,
							paddingRight: 50,
						},
					},
					timeCounter: {
						content: this.timeText,
						styles: {
							paddingLeft: 50,
							paddingRight: 50,
						},
					},
				},
				styles: {
					position: "centerTop",
					width: "100%",
					maxHeight: "10%",
					marginTop: 10,
				},
			},
		});
	}
	set lives(lives: number) {
		this.livesText.text = "❤️ " + lives.toString();
	}
	set coins(coins: number) {
		this.coinsText.text = "🪙 " + coins.toString();
	}
	set time(time: string) {
		this.timeText.text = "🕒 " + time;
	}
}
