import { Storage } from "@lib/storage";

export class Actions {
	static actions: Map<string, boolean> = new Map();
	static inputs: Map<string, string[]> = Storage.getMap("inputs");
	static clicked: Map<string, boolean> = new Map();
	static debug = false;
	static lock = false;
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
	static defaultBinds: { name: string; binds: string[] }[] = [
		{ name: "jump", binds: ["arrowup", "w"] },
		{ name: "crouch", binds: ["arrowdown", "s"] },
		{ name: "left", binds: ["arrowleft", "d"] },
		{ name: "right", binds: ["arrowright", "a"] },
		{ name: "roll", binds: ["c"] },
		{ name: "groundpound", binds: ["x"] },
		{ name: "dive", binds: ["v"] },
		{ name: "back", binds: ["escape"] },
		{ name: "test", binds: ["p"] },
		{ name: "run", binds: ["shift"] },
		{ name: "debug", binds: ["`"] },
		{ name: "trash", binds: ["x"] },
		{ name: "copyLevel", binds: ["c"] },
		{ name: "pin1", binds: ["1"] },
		{ name: "pin2", binds: ["2"] },
		{ name: "pin3", binds: ["3"] },
		{ name: "pin4", binds: ["4"] },
		{ name: "pin5", binds: ["5"] },
		{ name: "pin6", binds: ["6"] },
		{ name: "pin7", binds: ["7"] },
		{ name: "pin8", binds: ["8"] },
		{ name: "pin9", binds: ["9"] },
		{ name: "pin10", binds: ["10"] },
	];
	static init() {
		//@ts-expect-error
		window.action = Actions;

		Actions.inputs.forEach((v) =>
			v.forEach((v) => {
				Actions.actions.set(v, false);
			}),
		);
		this.defaultBinds.forEach(({ name, binds }) => {
			if (Actions.isBound(name)) return;
			Actions.bind(name, binds);
		});

		window.addEventListener("keydown", (ev) => {
			if (this.lock) return;
			const actions = this.inputs.get(ev.key.toLowerCase()) || [];
			for (const action of actions) {
				this.actions.set(action, true);
				if (this.debug)
					console.log(`Pressed: ${action} with key ${ev.key.toLowerCase()}`);
			}
		});

		window.addEventListener("keyup", (ev) => {
			const actions = this.inputs.get(ev.key.toLowerCase()) || [];
			for (const action of actions) {
				this.actions.set(action, false);
				if (this.debug)
					console.log(`Unpressed: ${action} with key ${ev.key.toLowerCase()}`);
			}
		});
	}
	static reset() {
		this.inputs = new Map();
		this.defaultBinds.forEach(({ name, binds }) => {
			if (Actions.isBound(name)) return;
			Actions.bind(name, binds);
		});
	}
}
