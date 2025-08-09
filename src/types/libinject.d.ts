declare global {
	 
	type Injector = ((cir: Cir) => void)|AsyncInjector;
	type AsyncInjector = (cir: Cir) => Promise<void>;
	type InjectMethod = 'HEAD' | 'RETURN' | 'ASYNC';

	class Cir {
		constructor(args: any[], originalFn: Function);

		args: any[];

		cancel(): void;

		reinstate(): void;

		isCanceled(): boolean;

		setReturnValue(value: any): void;

		setRawReturnValue(value: any): void;

		getReturnValue(): any;

		getOriginalFunction(): Function;
	}

	interface AsyncRecord {
		fn: AsyncInjector;
		earlyReturn?: Injector;
	}

	class ReverseArray<T> implements Iterable<T> {
		unshift(val: T): void;

		[Symbol.iterator](): Iterator<T>;

		readonly length: number;

		toArray(): T[];

		some(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: any): boolean;
	}

	class InjectFunctionRecord {
		constructor(rawFn: Function);

		readonly rawFn: Function;

		get HEAD(): ReverseArray<Injector>;

		get RETURN(): Injector[];

		get ASYNC(): ReverseArray<AsyncRecord>;

		add(method: InjectMethod, fn: Injector, earlyReturn?: Injector): void;

		hasAsyncMethod(): boolean;

		hasEarlyReturnMethod(): boolean;
	}

	class InjectorManager {
		inject(rawFnPath: string, at: InjectMethod, injector: Injector, earlyReturn?: Injector): void;

		static readonly version: string;
	}


	const injector: InjectorManager;
}

export {};
