import { Semaphore } from "../lib/Semaphore.js";

const sharedArrayBuffer = await getFirstMessage();
const semaphore = Semaphore.on(sharedArrayBuffer);

semaphore.acquire(1);
doWork();
semaphore.release(1);

async function getFirstMessage() {
    return new Promise(resolve => {
        self.addEventListener("message", (message) => resolve(message.data), { once: true });
    });
}

function doWork() {
    console.log("worker starts working");
    const dummyBuffer = new Int32Array(new SharedArrayBuffer(4));
    Atomics.wait(dummyBuffer, 0, 0, 5000);
    console.log("worker ended working");
}
