/*:
 * @plugindesc Fix Bitmap.drawText warning from console
 *
 * @help
 *
 * rmmz Window_Base.flushTextState 少传递一个 align 给 Bitmap.drawText，
 * 导致尝试将 undefined 传递给 context.textAlign 从而在控制台扔出警告。
 * 对于高频变化的文字，这会导致一开 f12 就把 cpu 和我的血压一起拉满。
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
