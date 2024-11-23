export class Timer {
	counter = 0;
	time: number;
	constructor(time: number, done: boolean = false) {
		this.time = time;
		if (done) this.counter = time;
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
