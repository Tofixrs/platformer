import { Game } from "@lib/game";

export class Actions {
	static actions: Map<string, boolean> = new Map();
	static inputs: Map<string, string[]> = new Map();
	static debug = false;
	static bind(name: string, keys: string[]) {
		for (const key of keys) {
			const actionsBound = this.inputs.get(key) || [];
			actionsBound.push(name);
			this.inputs.set(key, actionsBound);
		}
	}

	static unbind(name: string, keys: string[]) {
		for (const key of keys) {
			const actionsBound = this.inputs.get(key) || [];

			this.inputs.set(
				key,
				actionsBound.filter((v) => v != name),
			);
		}
	}
}

window.addEventListener("keydown", (ev) => {
	const actions = Actions.inputs.get(ev.key) || [];
	for (const action of actions) {
		Actions.actions.set(action, true);
		if (Actions.debug) console.log(`Pressed: ${action}`);
	}
});

window.addEventListener("keyup", (ev) => {
	const actions = Actions.inputs.get(ev.key) || [];
	for (const action of actions) {
		Actions.actions.set(action, false);
		if (Actions.debug) console.log(`Unpressed: ${action}`);
	}
});

Actions.bind("switchWorld", ["p"]);
