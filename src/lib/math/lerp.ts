export function lerp2D(
	sx: number,
	sy: number,
	ex: number,
	ey: number,
	amt: number,
) {
	const dx = ex - sx;
	const dy = ey - sy;

	return {
		x: sx + dx * amt,
		y: sy + dy * amt,
	};
}
