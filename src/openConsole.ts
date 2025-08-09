(() => {
	if (globalThis.process?.versions?.nw) return globalThis.nw.Window.get().showDevTools();
})();