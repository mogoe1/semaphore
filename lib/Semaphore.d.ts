/**
 * Conceptually a smaphore can be used to manage a set of permits across different thrads.
 * The semaphore keeps track of how many permits are available. Each call to {@link Semaphore.acquire acquire()} blocks untill enough permits are available and takes all at once.
 * No longer needed permits can be released by calling {@link Semaphore.release release()}. This notifies blocked {@link Semaphore.acquire acquire()} calls.
 *
 * This implementation uses Atomics and a SharedArrayBuffer which holds the number of availabe permits.
 * To use a semaphore across multiple WebWorkers the SharedArrayBuffer can be shared to the Worker instances.
 */
export declare class Semaphore {
    /**
     * Number of permits accuired by this instance.
     */
    private _acquiredPermits;
    /**
     * The typed array which holds the number of availabe permits.
     */
    private _int32Array;
    /**
     * Creates a new semaphore object. The given Int32Array should be based on a SharedArrayBuffer, have length one and hold the number of currently availaber permits.
     *
     * @param int32Array The typed array which holds the number of availabe permits. It has to have length of one and it has to be based on a SharedArrayBuffer.
     */
    constructor(int32Array: Int32Array);
    /**
     * Number of permits acquired by this instance.
     */
    get acquiredPermits(): number;
    /**
     * Number of currently available permits.
     */
    get availablePermits(): number;
    /**
     * SharedArrayBuffer used by this semaphore.
     */
    get buffer(): SharedArrayBuffer;
    /**
     * Acquires a given number of permits from the semaphore. The call blocks untill enough permits are available and acquires all at once.
     *
     * @param num Number of permits to acquire.
     */
    acquire(num?: number): void;
    /**
     * Releases the given number of permits and returns them to the semaphore. It automatically notifies blocked {@link Semaphore.acquire acuire()} and pending {@link Semaphore.acquireAsync acquireAsync()} calls.
     *
     * @param num Number of permits to release
     */
    release(num?: number): void;
    /**
     * Acquires a given number of permits from the semaphore. Calls to the function do not block like calls to {@link Semaphore.acquire acquire} but immediately return with a promise. The promise resolves once all permis a available and acquired.
     *
     * This should be used in favor of {@link Semaphore.acquire acquire} if Atomics.wait is not available (eg. on the main thread).
     *
     * @param num Number of permits to acquire.
     * @returns {Promise<void>} A promise that resolves once all permits are acquired.
     */
    acquireAsync(num?: number): Promise<void>;
    /**
     * Creates a new Semaphore initially holding the specified number of permits.
     * @param capacity Intially availabe number of permits
     * @returns {Semaphore}
     */
    static createWithCapacity(capacity: number): Semaphore;
}
