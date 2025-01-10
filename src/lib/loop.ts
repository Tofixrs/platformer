interface LoopOpt {
	/**1/fps*/
	tick?: number;
	update: (dt: number) => void;
	fixedUpdate?: () => void;
	minFps?:number;
	maxFps?:number;
}

export class Loop {
	lastTime = 0;
	accumulator = 0;
	tick = 1 / 60;
	update: (dt: number) => void;
	fixedUpdate?: () => void;
	pause = false;
	lastPause = false;
	private maxDt;
	private minDt;
	constructor({ tick, update, fixedUpdate, minFps, maxFps}: LoopOpt) {
		this.update = update;
		this.tick = tick ? tick : this.tick;
		this.fixedUpdate = fixedUpdate;
		window.addEventListener("focus", () => {
			this.pause = false;
			this.lastPause = true;
		});
		window.addEventListener("blur", () => (this.pause = true));
		this.maxDt = 1 / (minFps ?? 1);
		this.minDt = 1 / (maxFps?? Infinity);
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
		if (t < this.lastTime) {
			this.lastTime = t;
			return window.requestAnimationFrame((t) => this.loop(t));
		}
		const dt = (t - this.lastTime) / 1000;
		if (this.minDt > dt) {
			return window.requestAnimationFrame((t) => this.loop(t));
		}
		this.lastTime = t;
		if (this.maxDt < dt) {
			return window.requestAnimationFrame((t) => this.loop(t));
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
