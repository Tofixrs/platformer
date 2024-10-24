import { Storage } from "@lib/game/storage";

export class Actions {
	static actions: Map<string, boolean> = new Map();
	static inputs: Map<string, string[]> = Storage.getMap("inputs");
	static clicked: Map<string, boolean> = new Map();
	static debug = false;
	static bind(name: string, keys: string[]) {
		this.actions.set(name, false);
		for (const key of keys) {
			const actionsBound = this.inputs.get(key.toLowerCase()) || [];
			actionsBound.push(name);
			this.inputs.set(key.toLowerCase(), actionsBound);
		}
		Storage.setMap("inputs", this.inputs);
	}

	static unbind(name: string, keys: string[]) {
		for (const key of keys) {
			const actionsBound = this.inputs.get(key) || [];

			this.inputs.set(
				key,
				actionsBound.filter((v) => v != name),
			);
		}
		Storage.setMap("inputs", this.inputs);
	}
	static hold(name: string) {
		return this.actions.get(name) || false;
	}
	static click(name: string) {
		if (this.hold(name) && !this.clicked.get(name)) {
			this.clicked.set(name, true);
			return true;
		} else if (this.hold(name) && this.clicked.get(name)) {
			return false;
		} else if (!this.hold(name) && this.clicked.get(name)) {
			this.clicked.set(name, false);
			return false;
		}
	}
	static isBound(action: string) {
		let res = false;
		this.inputs.forEach((v) =>
			v.forEach((v) => {
				if (v == action) res = true;
			}),
		);
		return res;
	}
	static init() {
		//@ts-expect-error
		window.action = Actions;

		Actions.inputs.forEach((v) =>
			v.forEach((v) => {
				Actions.actions.set(v, false);
			}),
		);
		const defaultBinds = [
			["jump", "ArrowUp"],
			["crouch", "ArrowDown"],
			["left", "ArrowLeft"],
			["right", "ArrowRight"],
			["roll", "c"],
			["groundpound", "x"],
			["longjump", "z"],
			["dive", "v"],
			["back", "escape"],
			["debug", "`"],
		];
		defaultBinds.forEach(([action, key]) => {
			if (Actions.isBound(action)) return;
			Actions.bind(action, [key]);
		});
	}
}

window.addEventListener("keydown", (ev) => {
	const actions = Actions.inputs.get(ev.key.toLowerCase()) || [];
	for (const action of actions) {
		Actions.actions.set(action, true);
		if (Actions.debug)
			console.log(`Pressed: ${action} with key ${ev.key.toLowerCase()}`);
	}
});

window.addEventListener("keyup", (ev) => {
	const actions = Actions.inputs.get(ev.key.toLowerCase()) || [];
	for (const action of actions) {
		Actions.actions.set(action, false);
		if (Actions.debug)
			console.log(`Unpressed: ${action} with key ${ev.key.toLowerCase()}`);
	}
});
