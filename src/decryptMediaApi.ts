/*:
 * @plugindesc use decryptFiles() / decryptAllFiles() in console to decrypt rpgmaker media(audio/image)
 */
import type {DataSystem, Utils as MZ_Utils} from "rmmz-types";

(() => {
	if (typeof require !== "function" || typeof process !== "object" || !process?.versions?.node || typeof find !== "function") return;
	const fs = require("fs");
	const assert = require("assert")
	const {TextDecoder} = require('util');

	type rmType = "MV" | "MZ";
	type rmFileHeads = "RPGMV" | "RPGMZ"; // rpgmz still using RPGMV head yet.
	const RPGMAKER_NAME = Utils.RPGMAKER_NAME as rmType;

	const UtilsOrDecrypter = globalThis?.[{MZ: "Utils", MV: "Decrypter"}[RPGMAKER_NAME]];
	assert(UtilsOrDecrypter?.decryptArrayBuffer, `can't find decryptArrayBuffer function. is current env: RPG ${RPGMAKER_NAME}?`)

	function fileHead(filePath: string): rmFileHeads | undefined {
		if (!fs.statSync(filePath).isFile()) return null
		const fd = fs.openSync(filePath, "r");
		const buffer = Buffer.alloc(5);
		const l = fs.readSync(fd, buffer, 0, 5, 0)
		fs.closeSync(fd);
		if (l < 5) return null;
		if (buffer.equals(Buffer.from([0x52, 0x50, 0x47, 0x4D, 0x5A]))) return "RPGMZ";
		if (buffer.equals(Buffer.from([0x52, 0x50, 0x47, 0x4D, 0x56]))) return "RPGMV";
	}


	let rmmvSuffixRegex = /\.(rpgmv[omp])$/;

	function fileNameSuffix(fileName: string): rmType | undefined {
		if (fileName.endsWith("_")) return "MZ"
		if (rmmvSuffixRegex.test(fileName)) return "MV"
	}

	const decSuffixMap = {
		rpgmvp: "png",
		rpgmvm: "m4a",
		rpgmvo: "ogg"
	};

	function toDecFileName(fileName: string): string {
		const match = rmmvSuffixRegex.exec(fileName);
		if (!match) return fileName.replace(/_$/, ''); // MZ
		const ext = decSuffixMap[match[1]];
		return fileName.replace(rmmvSuffixRegex, `.${ext}`);
	}

	// 把所有 System.json 的 hasEncryptedImages = true 改成false，顺便改掉 $dataSystem 和 Utils/Decrypter 从而无需重启游戏
	function rewriteDataSystemEncInfo(): void {
		find(".").filter(fileName => fileName === "System.json" || fileName.endsWith("/System.json")) // some l18n mod may use multiply System.json
			.forEach(fileName => {
				const buffer: Buffer = fs.readFileSync(fileName)
				let dataSystem: { hasEncryptedImages: boolean, hasEncryptedAudio: boolean };
				try {
					const s: string = (new TextDecoder('utf-8')).decode(new Uint8Array(buffer).buffer)
					dataSystem = JSON.parse(s)
				} catch (e) {
					console.log(`can't parse ${fileName}`)
					console.log(e)
					return;
				}
				if (typeof dataSystem?.hasEncryptedImages !== "boolean" || typeof dataSystem?.hasEncryptedAudio !== "boolean") return
				dataSystem.hasEncryptedImages = false
				dataSystem.hasEncryptedAudio = false
				fs.writeFileSync(fileName, JSON.stringify(dataSystem, null, "\t"), "utf-8")
			});
		let $dataSystem = globalThis.$dataSystem as unknown as DataSystem
		$dataSystem.hasEncryptedImages = false
		$dataSystem.hasEncryptedAudio = false
		switch (RPGMAKER_NAME) {
			case "MZ":
				(Utils as unknown as typeof MZ_Utils)._hasEncryptedAudio = false;
				(Utils as unknown as typeof MZ_Utils)._hasEncryptedImages = false
				break
			case "MV":
				Decrypter.hasEncryptedAudio = false
				Decrypter.hasEncryptedImages = false
				break
			default :
				throw new Error(`unknown RPGMaker name: ${RPGMAKER_NAME}`);
		}
	}

	function decryptFiles(path: string, removeOldFile: boolean = false, rewriteDecryptInfo: boolean = false, touchMediaForAndroid: boolean = false) {
		if (!path) {
			console.log(
				`
usage: 
	decryptFiles(dir_or_file_name) // decrypt a file or a dir
		decryptFiles("audio") // decrypt all files in audio dir
	decryptFiles(dir_or_file_name, shouldRemoveOldEncryptedFile, shouldRewriteDataSystemDecryptInfo, touchNomediaFile)
	decryptFiles(".", true, true, true) // decrypt all files, then: 
						// remove old encrypted files, 
						// and set System.json hasEncryptedImages = false; hasEncryptedAudio=false; 
						// and create a empty file called ".nomedia" for android so Android MediaScanner won't add game images to your gallery.
						// 		see https://cs.android.com/android/platform/superproject/+/android15-qpr2-release:frameworks/av/media/libmedia/MediaScanner.cpp;l=142
`.trim()
			)
			return
		}
		const fileNames: string[] = find(path)
		for (const fileName of fileNames) {
			let head: rmFileHeads | undefined = fileHead(fileName);
			let suffix: rmType | undefined = fileNameSuffix(fileName);
			// normal files(js, etc).
			if (!head && !suffix) continue
			// normal file with enc filename suffix(_, MV/_, MZ)
			if (!head) {
				removeOldFile ?
					fs.renameSync(fileName, toDecFileName(fileName)) :
					fs.copyFileSync(fileName, toDecFileName(fileName))
				continue
			}

			if (suffix !== RPGMAKER_NAME) {
				const s = suffix ? "unencrypted" : `RPG ${suffix}`
				console.warn(`found file ${fileName}, file head is RPG ${head} but suffix looks like ${s}`)
			}

			const buffer = new Uint8Array(fs.readFileSync(fileName, {encoding: null})).buffer;
			const decBuffer = UtilsOrDecrypter.decryptArrayBuffer(buffer)
			fs.writeFileSync(toDecFileName(fileName), Buffer.from(decBuffer))
			if (removeOldFile && suffix) fs.rmSync(fileName)
			console.log(`decrypted "${fileName}"`)
		}
		if (rewriteDecryptInfo) rewriteDataSystemEncInfo()
		if (touchMediaForAndroid) fs.openSync(".nomedia", "a");
	}

	function decryptAllFiles() {
		decryptFiles(".", true, true, true)
	}

	globalThis.decryptFiles = decryptFiles
	globalThis.decryptAllFiles = decryptAllFiles

})();