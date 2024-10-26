interface LoopOpt {
	/**1/fps*/
	tick?: number;
	update: (dt: number) => void;
	fixedUpdate?: () => void;
}

export class Loop {
	lastTime = 0;
	accumulator = 0;
	tick = 1 / 60;
	update: (dt: number) => void;
	fixedUpdate?: () => void;
	constructor({ tick, update, fixedUpdate }: LoopOpt) {
		this.update = update;
		this.tick = tick ? tick : this.tick;
		this.fixedUpdate = fixedUpdate;
	}
	run() {
		window.requestAnimationFrame((t) => this.loop(t));
	}
	loop(t: number) {
		const dt = (t - this.lastTime) / 1000;
		this.lastTime = t;
		if (this.fixedUpdate) {
			this.accumulator += dt;
			while (this.accumulator >= this.tick) {
				this.accumulator -= this.tick;
				this.fixedUpdate();
			}
		}
		this.update(dt);

		window.requestAnimationFrame((t) => this.loop(t));
	}
}
