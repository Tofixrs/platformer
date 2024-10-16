import { Application, Container, Rectangle, Text } from "pixi.js";
import { World } from "..";
import { ButtonContainer, ScrollBox } from "@pixi/ui";
import { Button } from "@lib/game/ui/button";
import { Vec2 } from "planck-js";
import { WorldManager } from "../manager";
import { Actions } from "input";
import { Graphics } from "@lib/game/graphics";

export class Settings extends World {
	public audioTabBtn: ButtonContainer;
	public bindTabBtn: ButtonContainer;
	public closeButton: ButtonContainer;
	public tabs: Map<string, Tab> = new Map();
	public currentTab = "";
	constructor(graphics: Graphics, worldManager: WorldManager) {
		super(graphics);
		this.audioTabBtn = Button({
			size: new Vec2(200, 75),
			color: 0xff0000,
			borderColor: 0x00ff00,
			content: "Audio",
		});

		this.audioTabBtn.onPress.connect(() => {
			this.changeTab("audio");
		});

		this.bindTabBtn = Button({
			size: new Vec2(250, 75),
			color: 0xff0000,
			borderColor: 0x00ff00,
			content: "Keybinds",
		});

		this.bindTabBtn.onPress.connect(() => {
			this.changeTab("bind");
		});

		this.closeButton = Button({
			size: new Vec2(75, 75),
			color: "black",
			borderColor: 0x00ff00,
			content: "❌",
		});

		this.closeButton.onPress.connect(() => {
			worldManager.changeWorld("mainMenu");
		});

		const bindTab = new BindTab();

		this.tabs.set("bind", bindTab);
		this.changeTab("bind");

		this.recenter(graphics.renderer.screen);

		this.c.addChild(this.bindTabBtn);
		this.c.addChild(this.audioTabBtn);
		this.c.addChild(this.closeButton);
	}
	changeTab(name: string) {
		if (this.tabs.get(this.currentTab)) {
			this.c.removeChild(this.tabs.get(this.currentTab)!.c);
		}

		this.currentTab = name;
		if (this.tabs.get(this.currentTab)) {
			this.c.addChild(this.tabs.get(this.currentTab)!.c);
		}
	}
	recenter(screen: Rectangle): void {
		super.recenter(screen);

		this.audioTabBtn.position.set(-screen.width / 4, -screen.height / 2 + 50);

		this.bindTabBtn.position.set(screen.width / 4, -screen.height / 2 + 50);

		this.closeButton.position.set(
			screen.width / 2 - 100,
			-screen.height / 2 + 50,
		);

		this.tabs.forEach((v) => {
			v.c.y = -screen.height / 2 + 150;
			v.c.x = -screen.width / 4 - 100;
			v.recenter(screen);
		});
	}
	createBindTab() {}
}

class Tab {
	c: Container = new Container();
	recenter(screen: Rectangle) {}
}

class BindTab extends Tab {
	public scrollbox: ScrollBox = new ScrollBox({
		height: 1000,
		width: 1500,
		elementsMargin: 50,
		type: "vertical",
		items: [...this.createKeys()],
		topPadding: 50,
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
			let x = 550;
			keys.forEach((v) => {
				const button = Button({
					content: v,
					size: new Vec2(150, 50),
					fontSize: 20,
				});

				button.onPress.connect(() => this.rebind(action, v));
				button.x = x;
				x += 500;
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
		this.scrollbox.height = screen.height + (-screen.height / 2 + 100);
	}
}
