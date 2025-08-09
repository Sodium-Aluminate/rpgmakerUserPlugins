(() => {
	const window = (globalThis as unknown as any);
	if (typeof require !== "function" || !window.process?.versions?.node) return;

	const fs = require("fs");
	const path = require("path");

	class File {
		name: string

		constructor(name: string) {
			this.name = name
		}
	}

	class Dir extends File {
		files: File[]

		constructor(name: string, files: File[] = []) {
			super(name);
			this.files = files
		}
	}


	function tree(filePath: string | string[], handler: TreeFileHandler | undefined): TreeFile | TreeDir {
		filePath = (Array.isArray(filePath) ? path.join(...filePath) : filePath) as string
		handler = (handler ?? (() => {})) as TreeFileHandler;

		if (!fs.statSync(filePath).isDirectory()) return new File(filePath)

		let rootNode = new Dir(filePath);

		function internalTree(cwd: string, dir: Dir): void {
			handler(cwd, true);
			try {
				for (let relPath of fs.readdirSync(cwd)) {
					let fullPath: string = path.join(cwd, relPath)
					if (!fs.statSync(fullPath).isDirectory()) {
						dir.files.push(new File(relPath))
						handler(fullPath, false)
						continue
					}
					let child = new Dir(relPath)
					dir.files.push(child)
					internalTree(fullPath, child)
				}
			} catch (_ignored) {}
		}

		internalTree(path.join(filePath), rootNode);
		return rootNode
	}

	function find(filePath: string = "."): string[] {
		const resultBuffer: string[] = []
		if (!fs.existsSync(filePath)) {
			console.error(`can't find: ${filePath}`);
			return [];
		}
		if (fs.lstatSync(filePath).isSymbolicLink()) {
			console.warn(`skip symbolic link "${filePath}", not support due infinite loop`)
			return []
		}

		resultBuffer.push(filePath)
		if (fs.statSync(filePath).isDirectory()) {
			try {
				const files = fs.readdirSync(filePath);
				files.forEach(childFileName => {
					const fullPath = path.join(filePath, childFileName)
					resultBuffer.push(...find(fullPath))
				})
			} catch (_ignored) { }
		}
		return resultBuffer
	}

	window.find = find;
	window.tree = tree
})();