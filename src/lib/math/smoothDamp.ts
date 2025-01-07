import { Vec2 } from "planck/with-testbed";
import { clamp } from "./util";

export function smoothDamp(
	current: number,
	target: number,
	currentVelocity: number,
	smoothTime: number,
	dt: number,
	maxSpeed: number = Infinity,
) {
	smoothTime = Math.max(0.0001, smoothTime);
	const omega = 2 / smoothTime;
	const x = omega * dt;
	const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
	const originalTo = target;
	const maxChange = maxSpeed * smoothTime;
	const change = clamp(current - target, -maxChange, maxChange);
	target = current - change;
	const temp = (currentVelocity + omega * change) * dt;
	currentVelocity = (currentVelocity + omega * change) * exp;
	const tempOutput = target + (change + temp) * exp;
	if (originalTo - current > 0 == tempOutput > originalTo) {
		const output = originalTo;
		currentVelocity = (tempOutput - originalTo) / dt;
		return {
			currentVelocity: currentVelocity,
			output,
		};
	}

	return {
		currentVelocity: currentVelocity,
		output: tempOutput,
	};
}

export function smoothDamp2D(
	current: Vec2,
	to: Vec2,
	currentVelocity: Vec2,
	smoothTime: number,
	dt: number,
	maxSpeed: number = Infinity,
) {
	let outputX = 0;
	let outputY = 0;

	smoothTime = Math.max(0.0001, smoothTime);
	const omega = 2 / smoothTime;
	const x = omega * dt;
	const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);

	let changeX = current.x - to.x;
	let changeY = current.y - to.y;

	const maxChange = maxSpeed * smoothTime;

	const maxChangeSq = maxChange * maxChange;
	const sqrmag = changeX * changeX + changeY * changeY;
	if (sqrmag > maxChangeSq) {
		const mag = Math.sqrt(sqrmag);
		changeX = (changeX / mag) * maxChange;
		changeY = (changeY / mag) * maxChange;
	}

	const target = to.clone();
	target.x = current.x - changeX;
	target.y = current.y - changeY;

	const tempX = (currentVelocity.x - omega * changeX) * dt;
	const tempY = (currentVelocity.x - omega * changeY) * dt;
	outputX = to.x + (changeX + tempX) * exp;
	outputY = to.y + (changeY + tempY) * exp;

	const origMinusCurrentX = to.x - current.x;
	const origMinusCurrentY = to.y - current.y;
	const outMinusOrigX = outputX - to.x;
	const outMinusOrigY = outputY - to.y;

	if (
		origMinusCurrentX * outMinusOrigX + origMinusCurrentY * outMinusOrigY >
		0
	) {
		outputX = to.x;
		outputY = to.y;
		currentVelocity.x = (outputX - to.x) / dt;
		currentVelocity.y = (outputY - to.y) / dt;
	}

	return new Vec2(outputX, outputY);
}
