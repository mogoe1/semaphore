const MAX_PERMITS = 0x7fffffff;

function validatePermitCount(num: number, parameterName: string): void {
    if (!Number.isInteger(num) || num <= 0 || num > MAX_PERMITS) {
        throw new RangeError(`${parameterName} must be a positive 32-bit integer`);
    }
}

/**
 * Conceptually a semaphore can be used to manage a set of permits across different threads.
 * The semaphore keeps track of how many permits are available. Each call to {@link Semaphore.acquire acquire()} blocks until enough permits are available and takes all at once.
 * No longer needed permits can be released by calling {@link Semaphore.release release()}. This notifies blocked {@link Semaphore.acquire acquire()} calls.
 *
 * This implementation uses Atomics and a SharedArrayBuffer which holds the number of available permits.
 * To use a semaphore across multiple WebWorkers the SharedArrayBuffer can be shared to the Worker instances.
 */
export class Semaphore {
    /**
     * The typed array which holds the number of available permits.
     */
    private _int32Array: Int32Array;

    /**
     * Creates a new semaphore object. The given Int32Array should be based on a SharedArrayBuffer, have length one and hold the number of currently available permits.
     *
     * @param int32Array The typed array which holds the number of available permits. It has to have length of one and it has to be based on a SharedArrayBuffer.
     */
    constructor(int32Array: Int32Array) {
        if (!(int32Array.buffer instanceof SharedArrayBuffer)) {
            throw new TypeError(`${int32Array} is not a shared typed array`);
        }
        if (int32Array.length !== 1) {
            throw new Error(`${int32Array} does not have length 1`);
        }

        this._int32Array = int32Array;
    }

    /**
     * Number of currently available permits.
     */
    public get availablePermits(): number {
        return Atomics.load(this._int32Array, 0);
    }

    /**
     * SharedArrayBuffer used by this semaphore.
     */
    public get buffer(): SharedArrayBuffer {
        return this._int32Array.buffer as SharedArrayBuffer;
    }

    /**
     * Acquires a given number of permits from the semaphore. The call blocks until enough permits are available and acquires all at once.
     *
     * @param num Number of permits to acquire.
     */
    public acquire(num = 1): void {
        validatePermitCount(num, "num");

        while (true) {
            const available = Atomics.load(this._int32Array, 0);
            if (available < num) {
                Atomics.wait(this._int32Array, 0, available); // wait until the value changes
                continue; // and try again
            }

            if (
                Atomics.compareExchange(this._int32Array, 0, available, available - num) ===
                available
            ) {
                break;
            }
        }
    }

    /**
     * Releases the given number of permits and returns them to the semaphore. It automatically notifies blocked {@link Semaphore.acquire acquire()} and pending {@link Semaphore.acquireAsync acquireAsync()} calls.
     * Permits can be released by any thread; the caller does not need to have acquired them.
     *
     * @param num Number of permits to release
     */
    public release(num = 1): void {
        validatePermitCount(num, "num");

        while (true) {
            const available = Atomics.load(this._int32Array, 0);
            if (available > MAX_PERMITS - num) {
                throw new RangeError("Releasing permits would exceed the maximum permit count");
            }

            if (
                Atomics.compareExchange(this._int32Array, 0, available, available + num) ===
                available
            ) {
                Atomics.notify(this._int32Array, 0);
                break;
            }
        }
    }

    /**
     * Acquires a given number of permits from the semaphore. Calls to the function do not block like calls to {@link Semaphore.acquire acquire} but immediately return with a promise. The promise resolves once all permits are available and acquired.
     *
     * This should be used in favor of {@link Semaphore.acquire acquire} if Atomics.wait is not available (eg. on the main thread).
     *
     * @param num Number of permits to acquire.
     * @returns {Promise<void>} A promise that resolves once all permits are acquired.
     */
    public async acquireAsync(num = 1): Promise<void> {
        validatePermitCount(num, "num");

        while (true) {
            const available = Atomics.load(this._int32Array, 0);
            if (available < num) {
                // oxlint-disable-next-line typescript/no-explicit-any
                await (Atomics as any).waitAsync(this._int32Array, 0, available).value; // wait until the value changes
                continue; // and try again
            }

            if (
                Atomics.compareExchange(this._int32Array, 0, available, available - num) ===
                available
            ) {
                break;
            }
        }
    }

    /**
     * Creates a new Semaphore initially holding the specified number of permits.
     * @param capacity Initially available number of permits
     * @returns {Semaphore}
     */
    public static createWithInitialCapacity(capacity: number): Semaphore {
        if (!Number.isInteger(capacity) || capacity < 0 || capacity > MAX_PERMITS) {
            throw new RangeError(`capacity must be a non-negative 32-bit integer`);
        }

        const sab = new SharedArrayBuffer(4);
        new DataView(sab).setInt32(0, capacity, true);
        return new Semaphore(new Int32Array(sab));
    }
}
