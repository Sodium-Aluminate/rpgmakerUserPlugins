(() => {
	const window = globalThis as any

	const rpgMakerName = window.Utils.RPGMAKER_NAME;

	switch (rpgMakerName) {
		case "MZ":
			injector.inject("StorageManager.jsonToZip", "HEAD", function (cir: Cir) {
				if (!window.Input?.isPressed || window.Input.isPressed("shift")) return

				const [json] = cir.args
				cir.setReturnValue(Promise.resolve(json))
			});
			injector.inject("StorageManager.zipToJson", "HEAD", function (cir: Cir) {
				const [zipOrJson] = cir.args;
				try {
					window.JsonEx.parse(zipOrJson)
					cir.setReturnValue(Promise.resolve(zipOrJson))
				} catch (ignored) {
				}
			})
			break
		case "MV":
			injector.inject("LZString.compressToBase64", "HEAD", function (cir: Cir) {
				if (!window.Input?.isPressed || window.Input.isPressed("shift")) return

				const [json] = cir.args
				cir.setReturnValue(json)
			})
			injector.inject("LZString.decompressFromBase64", "HEAD", function (cir: Cir) {
				// sadly, if some save file only save a number like "1234", we can't find out if it is a b64 or not.
				const data: string = cir.args[0]
				if (typeof data !== "string") return
				try {
					JSON.parse(data)
					cir.setReturnValue(data)
				} catch (ignored) {}
				if (!(data.length % 4 === 0 && /^[-A-Za-z0-9+/]*={0,2}$/.exec(data))) { cir.setReturnValue(data) }
			});
			break
		default:
			console.warn(`unknown rpgmaker version: ${rpgMakerName}`)
	}
})()