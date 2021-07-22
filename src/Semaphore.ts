/**
 * A semaphore based on a {@link SharedArrayBuffer}.
 * 
 * "Conceptually, a semaphore maintains a set of permits. Each acquire() blocks if necessary until a permit is available, and then takes it. Each release() adds a permit, potentially releasing a blocking acquirer. However, no actual permit objects are used; the Semaphore just keeps a count of the number available and acts accordingly." [{@link https://docs.oracle.com/javase/7/docs/api/java/util/concurrent/Semaphore.html docs.oracle.com}]
 */
export class Semaphore {
    private _acquiredPermits: number;
    private _int32Array: Int32Array;

    /**
     * Create a new Semaphore
     * @param int32Array TypedArray that is based on a {@link SharedArrayBuffer} with length one.
     */
    constructor(int32Array: Int32Array) {
        if (!(int32Array.buffer instanceof SharedArrayBuffer)) {
            throw new Error("int32Array.buffer has to be an instance of SharedArrayBuffer");
        }
        if (int32Array.length !== 1) {
            throw new Error("int32Array has to have a length of one");
        }

        this._acquiredPermits = 0;
        this._int32Array = int32Array;
    }

    /**
     * Number of permits acquired by this semaphore object
     */
    public get acquiredPermits(): number {
        return this._acquiredPermits;
    }

    /**
     * Number of currently available permits
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
     * Releases the given number of permits, returning them to the semaphore.
     * @param num Number of permits to release
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
     * Acquires the given number of permits from this semaphore. The promise returned by this function resolves once all are available.  
     * This should be used in favor of {@link Semaphore.acquire} if {@link Atomics.wait} is not available (eg. on the main thread).
     * @param num Number of permits to acquire.
     * @returns {Promise<void>}
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
     * Creates a new Semaphore holding a specified number of permits
     * @param permits Intially availabe permits
     * @returns {Semaphore}
     */
    public static fromCapacity(permits: number): Semaphore {
        const sab = new SharedArrayBuffer(4);
        new DataView(sab).setInt32(0, permits, true);
        return new Semaphore(new Int32Array(sab));
    }
}
