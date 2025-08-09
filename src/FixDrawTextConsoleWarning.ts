/*:
 * @plugindesc Fix Bitmap.drawText warning from console
 */
(() => {
	const window = (globalThis as unknown as any);
	const availableAligns = {
		left: "left",
		right: "right",
		center: "center",
		start: "start",
		end: "end",
		default: "start"
	};
	if (typeof window.Bitmap === "undefined")
		throw new Error("rmmz not loaded?");

	injector.inject("Bitmap.prototype.drawText", "HEAD", function (cir: Cir): void {
		const args = cir.args
		let align = args[5] ?? this.context.textAlign;
		align = availableAligns[String(align).toLowerCase()] ?? availableAligns.default;
		args[5] = align;
	})
})();
