/**
 * Conceptually a smaphore can be used to manage a set of permits across different thrads.
 * The semaphore keeps track of how many permits are available. Each call to {@link Semaphore.acquire acquire()} blocks untill enough permits are available and takes all at once.
 * No longer needed permits can be released by calling {@link Semaphore.release release()}. This notifies blocked {@link Semaphore.acquire acquire()} calls.
 * 
 * This implementation uses Atomics and a SharedArrayBuffer which holds the number of availabe permits.
 * To use a semaphore across multiple WebWorkers the SharedArrayBuffer can be shared to the Worker instances.
 */
export class Semaphore {
    /**
     * Number of permits accuired by this instance.
     */
    private _acquiredPermits: number;

    /**
     * The typed array which holds the number of availabe permits.
     */
    private _int32Array: Int32Array;

    /**
     * Creates a new semaphore object. The given Int32Array should be based on a SharedArrayBuffer, have length one and hold the number of currently availaber permits.
     * 
     * @param int32Array The typed array which holds the number of availabe permits. It has to have length of one and it has to be based of a SharedArrayBuffer.
     */
    constructor(int32Array: Int32Array) {
        if (!(int32Array.buffer instanceof SharedArrayBuffer)) {
            throw new TypeError(`${int32Array} is not a shared typed array`);
        }
        if (int32Array.length !== 1) {
            throw new Error(`${int32Array} does not have length 1`);
        }

        this._acquiredPermits = 0;
        this._int32Array = int32Array;
    }

    /**
     * Number of permits acquired by this instance.
     */
    public get acquiredPermits(): number {
        return this._acquiredPermits;
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
     * Acquires a given number of permits from the semaphore. The call blocks untill enough permits are available and acquires all at once.
     * 
     * @param num - Number of permits to acquire.
     */
    public acquire(num = 1): void {
        if (num <= 0) {
            throw new Error("num may not be equal to or less than zero");
        }

        while (true) {
            const available = Atomics.load(this._int32Array, 0);
            if (available < num) {
                Atomics.wait(this._int32Array, 0, available); // wait untill the value changes
                continue; // and try again
            }

            if (Atomics.compareExchange(this._int32Array, 0, available, available - num) === available) {
                this._acquiredPermits += num;
                break;
            }
        }
    }

    /**
     * Releases the given number of permits and returns them to the semaphore. It automatically notifies blocked {@link Semaphore.acquire acuire()} and pending {@link Semaphore.acquireAsync acquireAsync()} calls.
     * 
     * @param num - Number of permits to release
     */
    public release(num = 1): void {
        if (num > this._acquiredPermits) {
            throw new Error("Amount to release is greater than the amount acquired");
        }

        while (true) {
            const available = Atomics.load(this._int32Array, 0);
            if (Atomics.compareExchange(this._int32Array, 0, available, available + num) === available) {
                this._acquiredPermits -= num;
                Atomics.notify(this._int32Array, 0);
                break;
            }
        }
    }

    /**
     * Acquires a given number of permits from the semaphore. Calls to the function do not block like calls to {@link Semaphore.acquire acquire} but immediately return with a promise. The promise resolves once all permis a available and acquired.
     * 
     * This should be used in favor of {@link Semaphore.acquire acquire} if Atomics.wait is not available (eg. on the main thread).
     * 
     * @param num Number of permits to acquire.
     * @returns {Promise<void>} - A promise that resolves once all permits are acquired. 
     */
    public async acquireAsync(num = 1): Promise<void> {
        while (true) {
            const available = Atomics.load(this._int32Array, 0);
            if (available < num) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (Atomics as any).waitAsync(this._int32Array, 0, available).value; // wait untill the value changes
                continue; // and try again
            }

            if (Atomics.compareExchange(this._int32Array, 0, available, available - num) === available) {
                this._acquiredPermits += num;
                break;
            }
        }
    }

    /**
     * Creates a new Semaphore initially holding the specified number of permits.
     * @param permits Intially availabe permits
     * @returns {Semaphore}
     */
    public static fromCapacity(permits: number): Semaphore {
        const sab = new SharedArrayBuffer(4);
        new DataView(sab).setInt32(0, permits, true);
        return new Semaphore(new Int32Array(sab));
    }
}
