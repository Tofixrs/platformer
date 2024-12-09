import { Container, Rectangle, Text } from "pixi.js";
import { World } from "..";
import { ScrollBox, Slider } from "@pixi/ui";
import { Button } from "@ui/button";
import { Vec2 } from "planck-js";
import { Actions } from "@lib/input";
import { Graphics } from "graphics";
import { Content, Layout } from "@pixi/layout";
import { BigButton } from "@lib/ui/big_button";
import { WorldController } from "world/controller";
import { Storage } from "@lib/storage";
import { Window } from "@lib/ui/Window";
import i18next from "i18next";
import { SmallButton } from "@lib/ui/small_button";

export class Settings extends World {
	public tabs: Map<string, Window<any>> = new Map();
	public currentTab = "";
	layout: Layout;
	tabContainer: Container = new Container();
	constructor(graphics: Graphics, worldController: WorldController) {
		super(graphics);
		this.main.x = 0;
		this.main.y = 0;
		const audio = new BigButton("Audio", "", () => this.changeTab("audio"));
		const bindBtn = new BigButton("binds", "", () => this.changeTab("bind"));
		const close = new SmallButton({
			text: "❌",
			hoverText: "Back",
			hoverContainer: this.top,
			onClick: (self) => {
				self.hover.visible = false;
				worldController.set("mainMenu");
			},
		});
		const tabBtns = [audio, bindBtn];

		this.layout = new Layout({
			content: {
				header: {
					content: {
						tabs: {
							content: tabBtns.map((v) => {
								return {
									content: v,
									styles: { marginLeft: 10, marginRight: 10 },
								};
							}),
							styles: {
								position: "centerTop",
							},
						},
						close: {
							content: close,
							styles: {
								position: "topRight",
								marginRight: 10,
							},
						},
					},
					styles: {
						position: "centerTop",
						marginTop: 10,
						maxHeight: "7.5%",
						width: "100%",
					},
				},
				lContent: {
					id: "lContent",
					styles: {
						position: "center",
						width: "100%",
						height: "100%",
					},
					content: this.tabContainer,
				},
			},
			styles: {
				width: "100%",
				height: "100%",
			},
		});
		const bindTab = new BindTab();
		const audioTab = new AudioTab();

		this.tabs.set("bind", bindTab);
		this.tabs.set("audio", audioTab);
		this.changeTab("bind");
		this.main.addChild(this.layout);
		this.recenter(graphics.renderer.screen);
	}
	changeTab(name: string) {
		if (this.tabs.get(this.currentTab)) {
			this.tabContainer.removeChild(this.tabs.get(this.currentTab)!);
		}
		this.currentTab = name;
		if (this.tabs.get(this.currentTab)) {
			this.tabContainer.addChild(this.tabs.get(this.currentTab)!);
		}
	}
	recenter(screen: Rectangle): void {
		this.tabs.forEach((v) => v.resize(screen.width, screen.height));
		this.layout.resize(screen.width, screen.height);
	}
}

class BindTab extends Window<undefined> {
	public scrollbox!: ScrollBox;
	public reboundAction = "";
	public reboundKey = "";
	public rebinding = false;
	constructor() {
		super({
			title: "Binds",
			styles: {
				maxHeight: "80%",
				position: "center",
			},
		});

		window.addEventListener("keydown", (v) => {
			if (!this.rebinding) return;

			Actions.unbind(this.reboundAction, [this.reboundKey, ""]);
			if (v.key.toLowerCase() != "escape") {
				Actions.bind(this.reboundAction, [v.key.toLowerCase()]);
			} else {
				Actions.bind(this.reboundAction, [""]);
			}
			this.rebinding = false;

			this.scrollbox.removeItems();
			this.scrollbox.addItems(this.createKeys());
		});
	}
	createContent(_data: undefined): Content {
		this.scrollbox = new ScrollBox({
			width: 850,
			height: 700,
			horPadding: 60,
			elementsMargin: 20,
			type: "vertical",
			items: [...this.createKeys()],
		});

		return {
			content: this.scrollbox,
			styles: {
				position: "centerTop",
				maxWidth: "80%",
				marginTop: 80,
			},
		};
	}

	createKeys() {
		const bindContainers: Container[] = [];
		Actions.actions.forEach((_, action) => {
			const keys: string[] = [];
			const container = new Container();
			const text = new Text({ text: i18next.t(action) });
			container.addChild(text);

			Actions.inputs.forEach((v, k) => {
				if (v.includes(action)) keys.push(k);
			});
			let x = 500;
			keys.forEach((v) => {
				const txt = i18next.t(v);
				const button = Button({
					content: txt.replace(txt[0], txt[0]?.toLocaleUpperCase()),
					size: new Vec2(150, 50),
					fontSize: 20,
				});

				button.onPress.connect(() => this.rebind(action, v));
				button.x = x;
				x += 200;
				container.addChild(button);
			});
			if (container.children.length != 3) {
				const button = Button({
					content: "",
					size: new Vec2(150, 50),
					fontSize: 20,
				});

				button.onPress.connect(() => this.rebind(action, ""));
				button.x = x;
				container.addChild(button);
			}

			bindContainers.push(container);
		});

		return bindContainers;
	}

	rebind(action: string, key: string) {
		this.rebinding = true;
		this.reboundAction = action;
		this.reboundKey = key;
	}
}

class AudioTab extends Window<number> {
	constructor() {
		const volume = Storage.getNum("volume", Howler.volume() * 100);
		Howler.volume(volume / 100);
		super({
			title: "audio",
			styles: {
				position: "centerTop",
				maxWidth: "80%",
				marginTop: 80,
			},
			data: volume,
		});
	}
	createContent(data: number): Content {
		const masterAudioSlider = new Slider({
			min: 0,
			max: 100,
			value: data,
			slider: "slider_point",
			bg: "slider_bg",
			fill: "slider_slider",
		});
		masterAudioSlider.onChange.connect((v) => {
			Howler.volume(v / 100);
			localStorage.setItem("volume", v.toString());
		});
		return {
			content: {
				row: {
					content: [
						{
							content: {
								text: {
									content: new Text({ text: "Master audio: " }),
									styles: {
										position: "center",
									},
								},
							},
							styles: {
								height: "160%",
							},
						},
						masterAudioSlider,
					],
					styles: {
						height: "10%",
					},
				},
			},
			styles: {
				width: "100%",
				height: "100%",
				padding: 80,
			},
		};
	}
	recenter(_screen: Rectangle) {}
}
