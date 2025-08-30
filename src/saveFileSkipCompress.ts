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
			injector.inject("LZString.compressToBase64", "HEAD", function (cir:Cir){
				if (!window.Input?.isPressed || window.Input.isPressed("shift")) return

				const [json] = cir.args
				cir.setReturnValue(json)
			})
			//StorageManager.saveToLocalFile = function(savefileId, json) {
			//     var data = LZString.compressToBase64(json);
			//     var fs = require('fs');
			//     var dirPath = this.localFileDirectoryPath();
			//     var filePath = this.localFilePath(savefileId);
			//     if (!fs.existsSync(dirPath)) {
			//         fs.mkdirSync(dirPath);
			//     }
			//     fs.writeFileSync(filePath, data);
			// };
			// 
			// StorageManager.loadFromLocalFile = function(savefileId) {
			//     var data = null;
			//     var fs = require('fs');
			//     var filePath = this.localFilePath(savefileId);
			//     if (fs.existsSync(filePath)) {
			//         data = fs.readFileSync(filePath, { encoding: 'utf8' });
			//     }
			//     return LZString.decompressFromBase64(data);
			// };
			break
		default:
			console.warn(`unknown rpgmaker version: ${rpgMakerName}`)
	}
})()