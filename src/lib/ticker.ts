export class Timer {
	counter = 0;
	time: number;
	doneFlag = false;
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
	doneOnece(): boolean {
		const r = this.counter >= this.time && !this.doneFlag;
		if (r) this.doneFlag = true;
		return r;
	}
	reset() {
		this.counter = 0;
		this.doneFlag = false;
	}
}
