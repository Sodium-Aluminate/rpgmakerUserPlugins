/*:
 * @plugindesc fuck ms ntfs.
 *
 */

(() => {
	'use strict';
	// avoid error in browser env
	const window = (globalThis as unknown as any);
	if (!window.require || !window.process?.versions?.node) return;

	if (typeof window.Bitmap === "undefined") throw new Error("rmmv/mz not loaded?");
	const fs = require("fs");
	const path = require("path");

	const caseInsensitive: boolean = window.process.platform === "win32";
	if (caseInsensitive) {
		console.log("caseInsensitiveLoading will not work due ntfs is already case insensitive.")
		return;
	}

	let rpgMakerName = window.Utils.RPGMAKER_NAME;
	const htmlDir: string = (() => {
		const pathParts = new URL(location.href).pathname.split('/').filter(Boolean)
		pathParts.pop();
		return path.join(...pathParts)
	})();
	if (
		(rpgMakerName === "MV" && htmlDir !== "www") ||
		(rpgMakerName === "MZ" && htmlDir !== ".")
	) console.warn("Unexpected HTML location, node-fs based pre-search may not correctly map DOM file requests.")

	function existsSync(...filePath: string[]): boolean {
		filePath = path.join(htmlDir, ...filePath)
		try {
			fs.accessSync(filePath);
			return true
		} catch (e) {
			return false
		}
	}

	function replaceExt(filePath: string, newExt: string): string {
		const dir: string = path.dirname(filePath);
		const name: string = path.basename(filePath, path.extname(filePath));
		return path.join(dir, name + newExt);
	}

	// fileNameCaches[foo/bar][aaa.txt] -> AAA.txt
	const fileNameCaches: Record<string, Record<string, string>> = {}

	function checkAndCache(cwd: string, target: string, permissiveExt: boolean = false): string | undefined {
		target = target.toLowerCase()
		let d = fileNameCaches[cwd]?.[target]
		if (d && existsSync(cwd, d)) return d

		let cache = fs.readdirSync(path.join(htmlDir, cwd))
			.reduce((records: Record<string, string>, fileName: string) => {
				let lowerCase = fileName.toLowerCase();
				if (records[lowerCase]) console.warn(`${JSON.stringify(cwd)} has two folders with the same name but different capitalization: ${JSON.stringify(fileName)} and ${JSON.stringify(records[lowerCase])}`)
				records[lowerCase] = fileName
				return records
			}, {});

		fileNameCaches[cwd] = cache;

		if (!permissiveExt || cache[target]) return cache[target]

		const rawExt = path.extname(target)

		let encExt: string;

		if (rpgMakerName === "MZ") {
			encExt = `${target}_`
		} else if (rpgMakerName === "MV" && window?.Decrypter?.extToEncryptExt) {
			encExt = window.Decrypter.extToEncryptExt(target)
		} else return
		const r = cache[encExt];
		return r && replaceExt(r, rawExt)
	}

	function resolveDecoded(url: string): string | undefined {

		if (existsSync(url)) return url;
		let dirs = url.split(path.sep);
		let fileName = dirs.pop()


		let realDirs = []
		for (let dir of dirs) {
			let d = checkAndCache(path.join(...realDirs), dir);
			if (typeof d !== "string") { return undefined; }
			realDirs.push(d)
		}
		let realFileName = checkAndCache(path.join(...realDirs), fileName, true)
		return typeof realFileName === "string" ? path.join(...realDirs, realFileName) : undefined;
	}

	function resolve(url: string): string | undefined {
		let r: string | undefined = resolveDecoded(decodeURIComponent(url));
		if (r === undefined) {
			console.warn(`can't resolve: ${url}`);
			return undefined
		}
		return encodeURI(r)
	}

	const mvInjector: Injector = function (cir: Cir) {
		let [url] = cir.args as [string]
		let r = resolve(url)
		if (typeof r === "string") cir.args[0] = r
	}
	const mzInjector: Injector = function (_cir: Cir) {
		let url = this._url as string
		let r = resolve(url)
		if (typeof r === "string") this._url = r
	}
	switch (rpgMakerName) {
		case "MV":
			if (window?.Bitmap?.prototype?._requestImage)
				injector.inject("Bitmap.prototype._requestImage", "HEAD", mvInjector)
			if (window?.WebAudio?.prototype?.initialize) { // H5Audio is not used in mv, so skip it cuz im lazy 
				injector.inject("WebAudio.prototype._load", "HEAD", mvInjector)
			}
			break;
		case "MZ":
			if (window?.Bitmap?.prototype?._startLoading)
				injector.inject("Bitmap.prototype._startLoading", "HEAD", mzInjector)
			if (window?.WebAudio?.prototype?._startLoading)
				injector.inject("WebAudio.prototype._startLoading", "HEAD", mzInjector)
			break;
	}


})();
