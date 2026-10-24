import { describe, expect, test } from "bun:test";
import { Semaphore } from "../src/Semaphore";

describe("Semaphore", () => {
    test("acquires and releases permits", () => {
        const semaphore = Semaphore.createWithCapacity(3);

        semaphore.acquire(2);
        expect(semaphore.availablePermits).toBe(1);
        expect(semaphore.acquiredPermits).toBe(2);

        semaphore.release();
        expect(semaphore.availablePermits).toBe(2);
        expect(semaphore.acquiredPermits).toBe(1);
    });

    test("acquireAsync waits for a released permit", async () => {
        const semaphore = Semaphore.createWithCapacity(1);
        semaphore.acquire();

        const pendingAcquire = semaphore.acquireAsync();
        semaphore.release();
        await pendingAcquire;

        expect(semaphore.availablePermits).toBe(0);
        expect(semaphore.acquiredPermits).toBe(1);
    });

    test.each([0, -1, 1.5, NaN, Infinity, 0x80000000])(
        "rejects invalid acquire count %s",
        (num) => {
            const semaphore = Semaphore.createWithCapacity(1);

            expect(() => semaphore.acquire(num)).toThrow(RangeError);
            expect(semaphore.availablePermits).toBe(1);
            expect(semaphore.acquiredPermits).toBe(0);
        },
    );

    test.each([0, -1, 1.5, NaN, Infinity, 0x80000000])(
        "rejects invalid async acquire count %s",
        async (num) => {
            const semaphore = Semaphore.createWithCapacity(1);

            await expect(semaphore.acquireAsync(num)).rejects.toThrow(RangeError);
            expect(semaphore.availablePermits).toBe(1);
            expect(semaphore.acquiredPermits).toBe(0);
        },
    );

    test.each([0, -1, 1.5, NaN, Infinity, 0x80000000])(
        "rejects invalid release count %s",
        (num) => {
            const semaphore = Semaphore.createWithCapacity(1);
            semaphore.acquire();

            expect(() => semaphore.release(num)).toThrow(RangeError);
            expect(semaphore.availablePermits).toBe(0);
            expect(semaphore.acquiredPermits).toBe(1);
        },
    );

    test.each([-1, 1.5, NaN, Infinity, 0x80000000])("rejects invalid capacity %s", (capacity) => {
        expect(() => Semaphore.createWithCapacity(capacity)).toThrow(RangeError);
    });

    test("allows zero capacity", () => {
        const semaphore = Semaphore.createWithCapacity(0);

        expect(semaphore.availablePermits).toBe(0);
    });

    test("rejects releasing more permits than acquired", () => {
        const semaphore = Semaphore.createWithCapacity(1);

        expect(() => semaphore.release()).toThrow(
            "Amount to release is greater than the amount acquired",
        );
        expect(semaphore.availablePermits).toBe(1);
    });
});
