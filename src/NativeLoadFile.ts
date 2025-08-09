/*:
 * @plugindesc using node fs native load instead of chromium xhr load to save time.
 */
(() => {
	// avoid error in browser env
	const window = (globalThis as unknown as any);
	if (typeof require !== "function" || typeof process !== "object" || !window.process?.versions?.node) return;
	const fs = require('fs');
	const fsPromises = fs.promises;


	async function readFile(path: string, option: any): Promise<ArrayBuffer | string> {
		let isEffect = /\.efkefc$/.exec(path);
		if (isEffect && efkefcCaches[path])
			return efkefcCaches[path];
		let f = await fsPromises.readFile(path, option);
		if (typeof f === "string") return tapEfkefcCache(path, f);
		const converted: ArrayBuffer = f.buffer.slice(f.byteOffset, f.byteOffset + f.byteLength);
		return tapEfkefcCache(path, converted);
	}

	function tapEfkefcCache<T extends ArrayBuffer | string>(path: string, value: T): T {
		if (/\.efkefc$/.exec(path)) efkefcCaches[path] = value
		return value
	}

	// ============================== xhr ==============================

	const RealXMLHttpRequest: typeof XMLHttpRequest = XMLHttpRequest;
	window["RealXMLHttpRequest"] = RealXMLHttpRequest;
	const efkefcCaches: Record<string, string | ArrayBuffer> = {};

	class FakeXMLHttpRequest {
		constructor() {
			const loggedFunctionCalls: Array<{ fn: PropertyKey, arg: any[] }> = [];
			const xhr = new RealXMLHttpRequest();
			const override: Record<PropertyKey, any> = {};

			function requestInfo(): [string, "utf8"?] | false {
				const openCalls = loggedFunctionCalls.filter(call => call.fn === "open");
				// rmmz 只会 open() 一次 因此如果不为1我们就不hook
				if (openCalls.length !== 1) return false;
				const [method, url] = openCalls[0].arg;
				// rmmz 只会 GET 一个相对 url，没有协议头
				if (method !== "GET" || url.match(/^[a-z][a-z0-9+-.]+:/i)) return false;
				const info: { url: string; type?: "utf8" } = {url: decodeURIComponent(url)};
				const overrideMimeTypeCalls = loggedFunctionCalls.filter(call => call.fn === "overrideMimeType");
				// rmmz 要么会 xhr.overrideMimeType("application/json") 要么会 xhr.responseType="arraybuffer"
				if (overrideMimeTypeCalls.length === 1 && overrideMimeTypeCalls[0].arg[0] === "application/json") info.type = "utf8";
				if (!info.type && override.responseType !== "arraybuffer") return false;
				return [info.url, info.type];
			}

			function send(...args: any[]) {
				const ri = requestInfo();
				if (!ri || args.filter(a => a !== null).length > 0)
					return xhr.send(...args);
				const [path, option] = ri;
				(async () => {
					try {
						override[option === "utf8" ? "responseText" : "response"] = await readFile(path, option);
					} catch (_e) {
						return xhr.send(...args);
					}
					override.status = 200;
					override.onload();
					xhr.abort();
				})();
			}

			override["send"] = send;
			return new Proxy(xhr, {
				get(target, p: PropertyKey, _receiver) {
					if (override[p])
						return override[p];
					const v = target[p];
					if (typeof v !== "function")
						return v;
					return (...args) => {
						loggedFunctionCalls.push({fn: p, arg: args});
						target[p](...args);
					};
				},
				set(target, p: PropertyKey, newValue, _receiver) {
					target[p] = newValue;
					override[p] = newValue;
					return true;
				}
			});
		}
	}

	window["XMLHttpRequest"] = FakeXMLHttpRequest;

	// ============================== fetch ==============================

	const realFetch = window.fetch;
	window["realFetch"] = realFetch;

	async function fetch(...args: [url: RequestInfo, init?: RequestInit]) {
		const [url, _init] = args;
		if (typeof url !== "string") return realFetch(...args);
		const options = args?.[1] ?? {};
		if ((options?.method ?? "GET") !== "GET") return realFetch(...args);
		try {
			const data = await fsPromises.readFile(url);
			return new Response(new Uint8Array(data));
		} catch (err) {
			return realFetch(...args);
		}
	}

	window.fetch = fetch;
})();
