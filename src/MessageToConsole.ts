/*:
 * @plugindesc log message & options to console, so you can hold ctrl without miss any message.
 */
(() => {
	"use strict";
	const window = globalThis;

	function logStyledLines(lines: any[], css: string[]) {
		if (lines.length === 0)
			return;
		const parts = [];
		const appliedCss = [];
		for (let i = 0; i < lines.length; i++) {
			if (i < css.length) {
				parts.push(`%c\t${lines[i]}`);
				appliedCss.push(css[i]);
			} else {
				parts.push(`\t${lines[i]}`);
			}
		}
		console.log(parts.join('\n'), ...appliedCss);
	}

	let __windowBase:any;

	function escape(s:string) {
		__windowBase ??= new window.Window_Base(new window.PIXI.Rectangle(0, 0, 0, 0));
		return __windowBase.convertEscapeCharacters(s);
	}

	injector.inject("Game_Message.prototype.add", "RETURN", function (cir) {
		const result = [];
		const args = cir.args;
		const text = args[0];
		const realText = this._texts[this._texts.length - 1];
		if (realText !== text)
			result.push(realText);
		result.push(text);
		const escapedText = escape(realText);
		if (escapedText !== realText)
			result.unshift(escapedText);
		logStyledLines(result, ['color: #ffffff; background-color: #333333; font-weight: bold; padding: 2px; font-size: 14px;',
			'color: #bbbbff; background-color: #333333; font-weight: bold; padding: 2px; font-size: 6px;']);
	});
	if (window.Utils?.RPGMAKER_NAME === "MV") {
		console.log("rmmv, skip hooking Game_Message.prototype.setSpeakerName");
	} else {
		console.assert(window.Utils?.RPGMAKER_NAME === "MZ")
		injector.inject("Game_Message.prototype.setSpeakerName", "RETURN", function (cir) {
			const result = [];
			const args = cir.args;
			const speakerName = args[0];
			const realSpeakerName = this._speakerName;
			if (realSpeakerName !== speakerName)
				result.push(realSpeakerName);
			result.push(speakerName);
			const escapedSpeakerName = escape(realSpeakerName);
			if (escapedSpeakerName !== realSpeakerName)
				result.unshift(escapedSpeakerName);
			logStyledLines(result, ['color: #dddddd; background-color: #333333; font-weight: bold; padding: 2px; font-size: 10px;',
				'color: #bbbbff; background-color: #333333; font-weight: bold; padding: 2px; font-size: 10px;']);
		});
	}

	function arrayEquals<T>(a:T[], b:T[]) {
		return (a.length === b.length) &&
			!a.some((val:T, i) => val !== b[i]);
	}

	injector.inject("Game_Message.prototype.setChoices", "RETURN", function (cir) {
		console.log(cir.args);
		if (arrayEquals(this._choices, cir.args[0]))
			console.log(this._choices);
	});
})();
