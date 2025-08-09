declare global {
	/**
	 * Recursively returns a flat list of all file and directory paths
	 * under the given `filePath`. Symbolic links are skipped.
	 *
	 * @param filePath - The root path to start walking from. Defaults to ".".
	 * @returns An array of full file/directory paths.
	 */
	function find(filePath?: string): string[];

	function tree(filePath: string | string[], handler: TreeFileHandler | undefined): TreeFile | TreeDir;

	type TreeFileHandler = ((path: string, isDir: boolean) => void);
	type TreeFile = {
		name: string
	}
	type TreeDir = TreeFile & {
		files: File[]
	}
}

export {};
