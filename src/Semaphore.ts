import { TimeoutError } from "./TimeoutError";

/**
 * A semaphore is a concurrency primitive used to manage a limited number of permits shared across multiple threads.
 * 
 * The semaphore keeps track of how many permits are currently available. Each call to {@link Semaphore.acquire acquire()} blocks until the required number of permits is available and then acquires them all at once.
 * 
 * Permits that are no longer needed can be released by calling {@link Semaphore.release release()}, which notifies any blocked {@link Semaphore.acquire acquire()} or pending {@link Semaphore.acquireAsync acquireAsync()} calls.
 * 
 * This implementation uses `Atomics` and a `SharedArrayBuffer` to store the number of available permits.
 * To share a semaphore across multiple WebWorkers, pass the underlying `SharedArrayBuffer` to the workers.
 */
export class Semaphore {
    /**
     * The typed array which holds the number of available permits.
     */
    private _int32Array: Int32Array;

    /**
     * Returns the number of permits currently available in the semaphore.
     */
    public get availablePermits(): number {
        return Atomics.load(this._int32Array, 0);
    }

    /**
     * Creates a new semaphore object.
     * 
     * @param int32Array A `Int32Array` with length 1 (4 bytes) backed by a `SharedArrayBuffer`, used to track available permits.
     * @throws {TypeError} If the array is not backed by a `SharedArrayBuffer`.
     * @throws {Error} If the array does not have a length of 1.
     */
    private constructor(int32Array: Int32Array) {
        if (!(int32Array.buffer instanceof SharedArrayBuffer)) {
            throw new TypeError(`${int32Array} is not a shared typed array`);
        }
        if (int32Array.length !== 1) {
            throw new Error(`${int32Array} does not have length 1`);
        }

        this._int32Array = int32Array;
    }

    /**
     * Acquires the specified number of permits from the semaphore.
     * This method blocks until the requested number of permits becomes available.
     * 
     * @param num The number of permits to acquire. Must be greater than 0.
     * @param timeoutMs Optional timeout in milliseconds. If exceeded, a {@link TimeoutError} is thrown.
     * @throws {Error} If `num` is less than or equal to 0.
     * @throws {TimeoutError} If the timeout expires before the permits are acquired.
     */
    public acquire(num: number = 1, timeoutMs: number | undefined = undefined): void {
        if (num <= 0) {
            throw new Error("num may not be equal to or less than zero");
        }

        if (timeoutMs < 0) {
            throw new Error("timeout may not be equal to or less than zero");
        }
        const startTime: number = performance.now();

        while (true) {
            const availableTime: number = timeoutMs !== undefined ? timeoutMs - (performance.now() - startTime) : undefined;
            const available: number = Atomics.load(this._int32Array, 0);

            if (available < num) {
                const result: string | null = Atomics.wait(this._int32Array, 0, available, availableTime); // wait until the value changes
                if (result === "timed-out") {
                    throw new TimeoutError();
                }
                continue; // and try again
            }

            if (Atomics.compareExchange(this._int32Array, 0, available, available - num) === available) {
                break;
            }
        }
    }

    /**
    * Asynchronously acquires the specified number of permits from the semaphore.
    * This method returns a promise that resolves once the requested number of permits is available and acquired.
    * 
    * This method is recommended on platforms where `Atomics.wait` is not available (e.g., in the main thread).
    * 
    * @param num The number of permits to acquire. Must be greater than 0.
    * @param timeoutMs Optional timeout in milliseconds. If exceeded, a {@link TimeoutError} is thrown.
    * @returns A promise that resolves when the requested number of permits has been acquired.
    * @throws {Error} If `num` is less than or equal to 0.
    * @throws {TimeoutError} If the timeout expires before the permits are acquired.
    */
    public async acquireAsync(num: number = 1, timeoutMs: number | undefined = undefined): Promise<void> {
        if (num <= 0) {
            throw new Error("num may not be equal to or less than zero");
        }

        if ((timeoutMs ?? 0) < 0) {
            throw new Error("timeout may not be equal to or less than zero");
        }
        const startTime: number = performance.now();

        while (true) {
            const availableTime: number = timeoutMs !== undefined ? timeoutMs - (performance.now() - startTime) : undefined;
            const available: number = Atomics.load(this._int32Array, 0);

            if (available < num) {
                const result: { async: boolean; value: string | null } = Atomics.waitAsync(this._int32Array, 0, available, availableTime); // wait until the value changes
                if (!result.async && result.value === "timed-out") {
                    throw new TimeoutError();
                }
                if (result.async && await result.value === "timed-out") {
                    throw new TimeoutError();
                }
                continue; // and try again
            }

            if (Atomics.compareExchange(this._int32Array, 0, available, available - num) === available) {
                break;
            }
        }
    }

    /**
     * Releases the specified number of permits and returns them to the semaphore.
     * Notifies any blocked or pending acquire calls.
     * 
     * @param num The number of permits to release. Must not exceed the number of currently held permits.
     */
    public release(num: number = 1): void {
        while (true) {
            const available: number = Atomics.load(this._int32Array, 0);
            if (Atomics.compareExchange(this._int32Array, 0, available, available + num) === available) {
                Atomics.notify(this._int32Array, 0);
                break;
            }
        }
    }

    /**
     * Creates a new `Semaphore` instance from a `SharedArrayBuffer`.
     * The buffer must contain a single 32-bit integer (4 bytes).
     * 
     * @param buffer A `SharedArrayBuffer` with 4 bytes.
     * @returns A new `Semaphore` instance using the given shared buffer.
     */
    public static on(buffer: SharedArrayBuffer): Semaphore {
        return new Semaphore(new Int32Array(buffer));
    }
}
