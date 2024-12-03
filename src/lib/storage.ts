export class Storage {
	static setMap(name: string, map: Map<any, any>) {
		localStorage.setItem(name, JSON.stringify(Array.from(map.entries())));
	}
	static getMap<T, U>(name: string, def?: Map<T, U>): Map<T, U> {
		const item = localStorage.getItem(name);
		if (!item) {
			return def || new Map();
		}

		return new Map(JSON.parse(item));
	}
	static getObj<T>(name: string, def: T): T {
		const item = localStorage.getItem(name);
		if (!item) {
			return def;
		}
		return JSON.parse(item);
	}
	static saveObj(name: string, obj: any) {
		localStorage.setItem(name, JSON.stringify(obj));
	}
	static getNum(name: string, def: number) {
		const item = localStorage.getItem(name);
		if (!item) {
			return def;
		}
		return Number(item);
	}
	static exists(name: string) {
		return localStorage.getItem(name) == null;
	}
}
