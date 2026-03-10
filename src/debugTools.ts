(() => {
	'use strict'

	function proxyArray(oldArray = [], logSet = true, logGet = true, debuggerSet = false, debuggerGet = false) {
		return new Proxy(oldArray, {
			set(target, p, value, receiver) {
				if (logSet) {
					console.log(`set ${String(p)} =`, value);
					console.log(new Error())
				}
				if (debuggerSet) debugger
				return Reflect.set(target, p, value, receiver);
			},
			get(target: any[], p: string | symbol, receiver: any): any {
				let v = Reflect.get(target, p, receiver);
				if (logGet) {
					console.log(`get ${String(p)}(${v})`)
					console.log(new Error())
				}
				if (debuggerGet) debugger
				return v
			}
		});
	}

	globalThis.proxyArray = proxyArray

	globalThis.watchVars = new Map<number, string[]>()


	function keyToId(k: string | number): number[] {
		if (typeof k === "number") return [k]
		return $dataSystem.variables.flatMap((comment, i) => comment === k ? i : [])
	}

	function asArray<T>(obj: T | T[]): T[] {
		return Array.isArray(obj) ? obj : [obj];
	}

	globalThis.watchVar = (keyOrId: number | number[] | string | string[], modes: string[] | undefined = undefined) => {
		const ids = asArray(keyOrId).flatMap(keyToId)
		for (let id of ids) {
			typeof modes === "undefined" ?
					watchVars.delete(id) :
					watchVars.set(id, modes)
		}

		$gameVariables._data = new Proxy($gameVariables._data, {
			set(target, p, value, receiver) {
				if (typeof p === "string" && p.match(/^\d+$/)) {
					const r = (watchVars.get(Number(p)) ?? []) as string[]
					if (r.includes("w")) {
						console.log(`set ${String(p)}(${$dataSystem.variables[p]}) <=`, value);
						console.log(new Error())
					}
					if (r.includes("wd")) debugger
				}
				return Reflect.set(target, p, value, receiver);
			},
			get(target: any[], p: string | symbol, receiver: any): any {
				let v = Reflect.get(target, p, receiver);

				if (typeof p === "string" && p.match(/^\d+$/)) {
					const r = (watchVars.get(Number(p)) ?? []) as string[]
					if (r.includes("r")) {
						console.log(`get ${String(p)}(${$dataSystem.variables[p]}) => `, v);
						console.log(new Error())
					}
					if (r.includes("rd")) debugger
				}
				return v
			}
		})

	}


})()