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
	pause = false;
	lastPause = false;
	minFps = 1;
	constructor({ tick, update, fixedUpdate }: LoopOpt) {
		this.update = update;
		this.tick = tick ? tick : this.tick;
		this.fixedUpdate = fixedUpdate;
		window.addEventListener("focus", () => {
			this.pause = false;
			this.lastPause = true;
		});
		window.addEventListener("blur", () => (this.pause = true));
	}
	run() {
		window.requestAnimationFrame((t) => this.loop(t));
	}
	loop(t: number) {
		if (!this.pause && this.lastPause) {
			this.lastPause = false;
			this.lastTime = performance.now();
			return window.requestAnimationFrame((t) => this.loop(t));
		}
		if (this.pause) return window.requestAnimationFrame((t) => this.loop(t));
		const dt = (t - this.lastTime) / 1000;
		this.lastTime = t;
		if (dt > 1 / this.minFps) {
			console.log("asd");
			this.accumulator += dt;
			return;
		}
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
