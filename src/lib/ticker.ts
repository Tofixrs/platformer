export class Timer {
	counter = 0;
	time: number;
	constructor(time: number) {
		this.time = time;
	}
	tick(dt: number) {
		this.counter += dt;
	}
	done(): boolean {
		return this.counter >= this.time;
	}
	reset() {
		this.counter = 0;
	}
}
