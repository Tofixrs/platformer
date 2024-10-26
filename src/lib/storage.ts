export class Storage {
	static setMap(name: string, map: Map<any, any>) {
		localStorage.setItem(name, JSON.stringify(Array.from(map.entries())));
	}
	static getMap<T, U>(name: string): Map<T, U> {
		return new Map(JSON.parse(localStorage.getItem(name) || "[]"));
	}
}
