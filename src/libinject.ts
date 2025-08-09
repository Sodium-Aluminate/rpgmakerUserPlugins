(() => {
	'use strict';
	const window = (globalThis as any);

	class Cir {
		#canceled: boolean;
		#returnValue: any;
		args: Array<any>;
		readonly #originalFn: Function;

		constructor(args: Array<any>, originalFn: Function) {
			this.#canceled = false;
			this.#returnValue = undefined;
			this.args = args
			this.#originalFn = originalFn
		}

		cancel() { this.#canceled = true}

		reinstate() {this.#canceled = false}

		isCanceled() { return this.#canceled}

		setReturnValue(value: any) {
			this.#returnValue = value;
			this.cancel();
		}

		setRawReturnValue(value: any) { this.#returnValue = value;}

		getReturnValue() { return this.#returnValue}

		getOriginalFunction() {return this.#originalFn}
	}

	type AsyncRecord = { fn: AsyncInjector, earlyReturn?: Injector }

	class ReverseArray<T> {
		private readonly internal: T[] = []

		unshift(val: T): void {
			this.internal.push(val)
		}

		[Symbol.iterator](): Iterator<T> {
			let i = this.internal.length
			const data = this.internal

			return {
				next(): IteratorResult<T> {
					if (i > 0)
						return {value: data[--i], done: false}
					return {done: true, value: undefined as any}
				}
			}
		}

		get length(): number {
			return this.internal.length
		}

		toArray(): T[] {
			return this.internal.slice().reverse()
		}

		some(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: any): boolean {
			return this.internal.some(predicate, thisArg)
		}
	}

	class InjectFunctionRecord {
		private readonly headFns: ReverseArray<Injector> = new ReverseArray<Injector>()
		private readonly returnFns: Injector[] = []
		private readonly asyncFns: ReverseArray<AsyncRecord> = new ReverseArray<AsyncRecord>()
		readonly rawFn: Function;

		constructor(rawFn: Function) {this.rawFn = rawFn}

		get HEAD(): ReverseArray<Injector> { return this.headFns }

		get RETURN(): Injector[] { return this.returnFns }

		get ASYNC(): ReverseArray<AsyncRecord> { return this.asyncFns }


		add(method: string, fn: Injector, earlyReturn?: Injector): void {
			switch (method) {
				case 'HEAD':
					this.headFns.unshift(fn)
					return
				case 'RETURN':
					this.returnFns.push(fn)
					return;
				case 'ASYNC':
					this.asyncFns.unshift({fn: (fn as unknown as AsyncInjector), earlyReturn})
			}
		}

		hasAsyncMethod(): boolean {return this.asyncFns.length > 0}

		hasEarlyReturnMethod(): boolean {return this.asyncFns.some(o => o.earlyReturn)}

	}


	class InjectorManager {

		#injectFns: { [rawFnPath: string]: InjectFunctionRecord } = {}

		static #findFnByName(rawFnPath: string): { obj: any, fn: Function, fnName: string } | undefined {
			const names = rawFnPath.split('.');
			const objNames = names.slice(0, -1);
			const fnName = names[names.length - 1];
			let obj: any = globalThis
			for (const prop of objNames) {
				obj = obj[prop];
				if (!obj) {
					console.error(`Object not found for rawFnPath: ${rawFnPath}`);
					return;
				}
			}
			const fn = obj[fnName]
			if (!fn) {
				console.error(`Object found, but field is empty: ${rawFnPath}`)
				console.error(fn)
				return;
			} else if (typeof fn !== "function") {
				console.error(`Object found, not a function: ${rawFnPath}`)
				console.error(fn)
				return;
			}
			return {obj, fn, fnName};
		}


		inject(rawFnPath: string, at: InjectMethod, injector: Injector, earlyReturn?: Injector) {
			if (this.#injectFns[rawFnPath]) {
				this.#injectFns[rawFnPath].add(at, injector, earlyReturn)
				return;
			}

			let {obj, fn, fnName} = InjectorManager.#findFnByName(rawFnPath) || {};
			if (!(obj && fn && fnName)) return

			let record = new InjectFunctionRecord(fn)
			this.#injectFns[rawFnPath] = record
			record.add(at, injector, earlyReturn);

			obj[fnName] = function (...arg: Array<any>) {
				let cir = new Cir(arg, fn)

				for (const headFn of record.HEAD) {
					headFn.apply(this, [cir])
					if (cir.isCanceled()) return cir.getReturnValue()
				}
				if (record.hasAsyncMethod()) {
					let hasEarlyReturnMethod = record.hasEarlyReturnMethod();
					let earlyReturnValue: any
					if (hasEarlyReturnMethod) {
						for (const asyncRecord of record.ASYNC) {
							if (!asyncRecord.earlyReturn) continue
							asyncRecord.earlyReturn.apply(this, [cir])
							if (cir.isCanceled()) break;
						}
						earlyReturnValue = cir.getReturnValue()
						cir.reinstate()
					}

					const thisObj: any = this;
					const asyncReturn = (async function () {
						for (const asyncRecord of record.ASYNC) {
							await asyncRecord.fn.apply(thisObj, [cir])
							if (cir.isCanceled()) return cir.getReturnValue();
						}
						cir.setRawReturnValue(fn.apply(thisObj, cir.args))
						for (const returnFn of record.RETURN) {
							returnFn.apply(thisObj, [cir])
							if (cir.isCanceled()) return cir.getReturnValue()
						}
						return cir.getReturnValue()
					})();

					return hasEarlyReturnMethod ? earlyReturnValue : asyncReturn
				}

				cir.setRawReturnValue(fn.apply(this, cir.args))
				for (const returnFn of record.RETURN) {
					returnFn.apply(this, [cir])
					if (cir.isCanceled()) return cir.getReturnValue()
				}
				return cir.getReturnValue()
			}
		}

		static readonly version = "1.1"
	}

	window.injector = new InjectorManager()
})();