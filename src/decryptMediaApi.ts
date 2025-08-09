// 提供一个 decryptFiles(path) 接口，来将加密文件解密
// decryptAllFiles() 接口，将所有文件解密并且删掉加密文件，然后将游戏json标记为未加密以防无法启动
// 说是api其实我建议在控制台call。
// 如果不在 node 环境（即，浏览器打开）那肯定没辙
(() => {
	const window = (globalThis as unknown as any);
	if (typeof require !== "function" || typeof process !== "object" || !window.process?.versions?.node || typeof window.find !== "function") return;
	const fs = require("fs");
	const assert = require("assert")
	const {TextDecoder} = require('util');

	type rmType = "MV" | "MZ";
	const RPGMAKER_NAME: rmType = window.Utils.RPGMAKER_NAME;

	const UtilsOrDecrypter = window?.[{MZ: "Utils", MV: "Decrypter"}[RPGMAKER_NAME]];
	assert(UtilsOrDecrypter?.decryptArrayBuffer, `can't find decryptArrayBuffer function. is current env: RPG ${RPGMAKER_NAME}?`)

	function fileHead(filePath: string): rmType | undefined {
		const fs = require("fs");
		if (!fs.statSync(filePath).isFile()) return null
		const fd = fs.openSync(filePath, "r");
		const buffer = Buffer.alloc(5);
		const l = fs.readSync(fd, buffer, 0, 5, 0)
		fs.closeSync(fd);
		if (l < 5) return null;
		if (buffer.equals(Buffer.from([0x52, 0x50, 0x47, 0x4D, 0x5A]))) return "MZ";
		if (buffer.equals(Buffer.from([0x52, 0x50, 0x47, 0x4D, 0x56]))) return "MV";
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
		window.$dataSystem.hasEncryptedImages = false
		window.$dataSystem.hasEncryptedAudio = false
		const UtilsOrDecrypter = window?.[{MZ: "Utils", MV: "Decrypter"}[RPGMAKER_NAME]];
		UtilsOrDecrypter.hasEncryptedImages = false
		UtilsOrDecrypter.hasEncryptedAudio = false
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
			let head: rmType | undefined = fileHead(fileName);
			let suffix: rmType | undefined = fileNameSuffix(fileName);
			// normal files(js, etc).
			if (!head && !suffix) continue
			// normal file with enc filename suffix(_, MV/_, MZ)
			if (!head) {
				if (removeOldFile) fs.renameSync(fileName, toDecFileName(fileName))
				else fs.copyFileSync(fileName, toDecFileName(fileName))
				continue
			}
			// head with different game env (e.g. try to decrypt MV file in MZ game)
			if (head !== RPGMAKER_NAME) {
				console.warn(`skip "${fileName}" because it's RPG ${head} game but script running in ${RPGMAKER_NAME}.`)
				continue
			}

			if (suffix !== head) {
				const s = suffix ? "unencrypted" : `RPG ${suffix}`
				console.warn(`found file ${fileName}, file head is RPG ${head} but suffix looks like ${s}`)
			}

			assert(head === RPGMAKER_NAME)
			const buffer = new Uint8Array(fs.readFileSync(fileName, {encoding: null})).buffer;
			const decBuffer = UtilsOrDecrypter.decryptArrayBuffer(buffer)
			fs.writeFileSync(toDecFileName(fileName), Buffer.from(decBuffer))
			if (removeOldFile && suffix) fs.rmSync(fileName)
			console.log(`decrypted "${fileName}"`)
		}
		if (rewriteDecryptInfo) rewriteDataSystemEncInfo()
		if (touchMediaForAndroid) fs.openSync(".nomedia", "a");
	}

	function decryptAllFiles() {decryptFiles(".", true, true, true)}

	window.decryptFiles = decryptFiles
	window.decryptAllFiles = decryptAllFiles

})();