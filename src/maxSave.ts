(() => {
	"use strict"
	switch (Utils?.RPGMAKER_NAME) { // just tell myself it works in both mv and mz
		case "MV":
		case "MZ":
			injector.inject("DataManager.maxSavefiles", "HEAD", function (cir) {
				cir.setReturnValue(1024)
			})
			break
		default:
			throw new Error(`unknown RPGMaker name: ${Utils?.RPGMAKER_NAME}`)
	}

	switch (Utils?.RPGMAKER_NAME) {
		case "MV":
			(() => {
				type Cache = { mtimeMs: number; cacheTimeMs: number; data: Set<string> }
				const caches: { [path: string]: Cache } = {}

				function updateCache(dir: string): Set<string> {
					const fs = require("fs")
					const curTime = Date.now()
					const mtime = fs.statSync(dir).mtimeMs
					const oldCache = caches[dir];
					if (oldCache && oldCache.mtimeMs === mtime) {
						oldCache.cacheTimeMs = curTime
						return oldCache.data
					}
					const data = new Set(fs.readdirSync(dir) as string[])
					caches[dir] = {
						mtimeMs: fs.statSync(dir).mtimeMs,
						cacheTimeMs: curTime,
						data
					}
					return data
				}

				function getCache(dir: string): Set<string> {
					let cache = caches[dir];
					if (!cache || Date.now() - cache.cacheTimeMs > 500) {
						return updateCache(dir)
					}
					return cache.data
				}

				injector.inject("`require('fs')`.existsSync", "HEAD", function (cir) {
					let [filePath] = cir.args as [string];
					const path = require("path")
					const [dirname, basename] = [path.dirname(filePath), path.basename(filePath)]
					let cache = getCache(dirname)
					cir.setReturnValue(cache.has(basename))
				})
			})();
			break
		case "MZ": // todo check it working on mz or not
			break
		default:
			throw new Error(`unknown RPGMaker name: ${Utils?.RPGMAKER_NAME}`)
	}
})()