import { describe, expect, test } from "bun:test";
import { Semaphore } from "../src/Semaphore";

describe("Semaphore", () => {
    test("acquires and releases permits", () => {
        const semaphore = Semaphore.createWithInitialCapacity(3);

        semaphore.acquire(2);
        expect(semaphore.availablePermits).toBe(1);

        semaphore.release();
        expect(semaphore.availablePermits).toBe(2);
    });

    test("acquireAsync waits for a released permit", async () => {
        const semaphore = Semaphore.createWithInitialCapacity(1);
        semaphore.acquire();

        const pendingAcquire = semaphore.acquireAsync();
        semaphore.release();
        await pendingAcquire;

        expect(semaphore.availablePermits).toBe(0);
    });

    test.each([0, -1, 1.5, NaN, Infinity, 0x80000000])(
        "rejects invalid acquire count %s",
        (num) => {
            const semaphore = Semaphore.createWithInitialCapacity(1);

            expect(() => semaphore.acquire(num)).toThrow(RangeError);
            expect(semaphore.availablePermits).toBe(1);
        },
    );

    test.each([0, -1, 1.5, NaN, Infinity, 0x80000000])(
        "rejects invalid async acquire count %s",
        async (num) => {
            const semaphore = Semaphore.createWithInitialCapacity(1);

            await expect(semaphore.acquireAsync(num)).rejects.toThrow(RangeError);
            expect(semaphore.availablePermits).toBe(1);
        },
    );

    test.each([0, -1, 1.5, NaN, Infinity, 0x80000000])(
        "rejects invalid release count %s",
        (num) => {
            const semaphore = Semaphore.createWithInitialCapacity(1);
            semaphore.acquire();

            expect(() => semaphore.release(num)).toThrow(RangeError);
            expect(semaphore.availablePermits).toBe(0);
        },
    );

    test.each([-1, 1.5, NaN, Infinity, 0x80000000])(
        "rejects invalid initial capacity %s",
        (capacity) => {
            expect(() => Semaphore.createWithInitialCapacity(capacity)).toThrow(RangeError);
        },
    );

    test("allows zero capacity", () => {
        const semaphore = Semaphore.createWithInitialCapacity(0);

        expect(semaphore.availablePermits).toBe(0);
    });

    test("allows releasing permits not acquired by this instance", () => {
        const semaphore = Semaphore.createWithInitialCapacity(1);

        expect(() => semaphore.release()).not.toThrow();
        expect(semaphore.availablePermits).toBe(2);
    });

    test("allows another semaphore instance to release a permit", () => {
        const semaphore = Semaphore.createWithInitialCapacity(0);
        const otherThread = new Semaphore(new Int32Array(semaphore.buffer));

        otherThread.release();

        expect(semaphore.availablePermits).toBe(1);
    });

    test("rejects releases that exceed the maximum permit count", () => {
        const semaphore = Semaphore.createWithInitialCapacity(0x7fffffff);

        expect(() => semaphore.release()).toThrow(RangeError);
        expect(semaphore.availablePermits).toBe(0x7fffffff);
    });
});
