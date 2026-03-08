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
})()