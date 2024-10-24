import { Application, Container, Rectangle, Text } from "pixi.js";
import { World } from "..";
import { ButtonContainer, FancyButton, ScrollBox } from "@pixi/ui";
import { Button } from "@lib/game/ui/button";
import { Vec2 } from "planck-js";
import { WorldManager } from "../manager";
import { Actions } from "input";
import { Graphics } from "@lib/game/graphics";
import { Layout } from "@pixi/layout";

export class Settings extends World {
	public tabs: Map<string, Tab> = new Map();
	public currentTab = "";
	layout: Layout;
	tabContainer: Container = new Container();
	constructor(graphics: Graphics, worldManager: WorldManager) {
		super(graphics);
		this.main.x = 0;
		this.main.y = 0;
		const audio = new FancyButton({
			defaultView: "audioBtn",
		});

		audio.onPress.connect(() => {
			this.changeTab("audio");
		});

		const bindBtn = new FancyButton({
			defaultView: "bindBtn",
		});

		bindBtn.onPress.connect(() => {
			this.changeTab("bind");
		});

		const close = new FancyButton({
			defaultView: "closeBtn",
		});

		close.onPress.connect(() => {
			worldManager.changeWorld("mainMenu");
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
						position: "top",
						display: "block",
						marginTop: 10,
					},
				},
				lContent: {
					id: "lContent",
					styles: {
						position: "center",
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

		this.tabs.set("bind", bindTab);
		this.changeTab("bind");
		this.main.addChild(this.layout);
		this.recenter(graphics.renderer.screen);
	}
	changeTab(name: string) {
		if (this.tabs.get(this.currentTab)) {
			this.tabContainer.removeChild(this.tabs.get(this.currentTab)!.c);
		}
		this.currentTab = name;
		if (this.tabs.get(this.currentTab)) {
			this.tabContainer.addChild(this.tabs.get(this.currentTab)!.c);
		}
	}
	recenter(screen: Rectangle): void {
		this.tabs.forEach((v) => v.recenter(screen));
		this.layout.resize(screen.width, screen.height);
	}
}

class Tab {
	c: Container = new Container();
	recenter(screen: Rectangle) {}
}

class BindTab extends Tab {
	public scrollbox: ScrollBox = new ScrollBox({
		height: 1000,
		width: 1000,
		topPadding: 10,
		elementsMargin: 50,
		type: "vertical",
		items: [...this.createKeys()],
	});

	public reboundAction = "";
	public reboundKey = "";
	public rebinding = false;
	constructor() {
		super();

		this.c.addChild(this.scrollbox);
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
	createKeys() {
		const bindContainers: Container[] = [];
		Actions.actions.forEach((_, action) => {
			const keys: string[] = [];
			const container = new Container();
			const text = new Text({ text: action });
			container.addChild(text);

			Actions.inputs.forEach((v, k) => {
				if (v.includes(action)) keys.push(k);
			});
			let x = 500;
			keys.forEach((v) => {
				const button = Button({
					content: v,
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
	recenter(screen: Rectangle) {
		this.scrollbox.height = screen.height / 4 + screen.height / 2;
	}
}
