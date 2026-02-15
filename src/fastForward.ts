(() => {
	let targetFastForwardHotkey = "tab";


	switch (Utils.RPGMAKER_NAME) {
		case "MZ":
			injector.inject("SceneManager.determineRepeatNumber", "RETURN", function (cir) {
					if (!Input.isPressed(targetFastForwardHotkey)) return
					let returnValue = cir.getReturnValue();
					if (typeof returnValue === "number") cir.setReturnValue(returnValue * 3)
				}
			);
			break
		case "MV":
			(() => {
				const target = $plugins.find(p => p.name === "Mano_InputConfig")
				if (target && typeof globalThis.Mano_InputConfig === "object") {
					if (typeof require !== "function" || !window.process?.versions?.node) return;
					const fs = require("fs")


					let cfg = (PluginManager.parameters("Mano_InputConfig"));
					let extendsMapper = JSON.parse(cfg.extendsMapper ?? "[]").map(s => JSON.parse(s));
					targetFastForwardHotkey = "fastForward"
					if (extendsMapper.some(inputDefine => inputDefine.src === "rpgmakerUserPlugins/fastForward")) return

					extendsMapper.push({
						name: JSON.stringify({jp: "加速", en: "speed up"}),
						src: "rpgmakerUserPlugins/fastForward",
						keySetting: JSON.stringify({keys: "", text: JSON.stringify({jp: "加速", en: "speed up"})}),
						adovanced: JSON.stringify({symbol: targetFastForwardHotkey}) // well jp style english
					})

					cfg.extendsMapper = JSON.stringify(extendsMapper.map(inputDefine => JSON.stringify(inputDefine)));

					target.parameters = cfg

					fs.writeFileSync("./www/js/plugins.js",
						`var $plugins = 
[
	${$plugins.map(plugin => JSON.stringify(plugin)).join(",\n\t")}
]`
					)
					location.reload()
				}
			})();
			(() => {

				function isWaiting() {
					let I = $gameMap?._interpreter
					if (!I) return false
					const accessed = new Set();
					while (I?._childInterpreter) {
						if (accessed.has(I)) {
							console.warn("wtf")
							return false
						}
						accessed.add(I)
						I = I?._childInterpreter
					}

					return (I as any)?._waitCount ?? 0 > 0;
				}

				let dt = SceneManager._deltaTime;
				Object.defineProperty(SceneManager, "_deltaTime", {
					get() {
						if (!Input.isPressed(targetFastForwardHotkey)) return dt
						return dt / (isWaiting() ? 10 : 2)
					},
					set(v) {
						dt = v;
					},
					configurable: true
				});
			})();
	}
})()