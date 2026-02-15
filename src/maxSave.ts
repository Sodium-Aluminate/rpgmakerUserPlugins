(() => {
	switch (Utils?.RPGMAKER_NAME) { // just tell myself it works in both mv and mz
		case "MV":
		case "MZ":
			injector.inject("DataManager.maxSavefiles", "HEAD", function (cir) {
				cir.setReturnValue(1024)
			})
			return
		default:
			throw new Error(`unknown RPGMaker name: ${Utils?.RPGMAKER_NAME}`)
	}
})()