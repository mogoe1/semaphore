// file: main.js
import { Semaphore } from "../lib/Semaphore.js";

const worker = new Worker("worker.js", { type: "module" });

const sharedArrayBuffer = new SharedArrayBuffer(4);
new DataView(sharedArrayBuffer).setInt32(0, 1); // On initial available permit
worker.postMessage(sharedArrayBuffer);

const semaphore = Semaphore.on(sharedArrayBuffer);
await semaphore.acquireAsync(1);
await doWork();
semaphore.release(1);

async function doWork() {
    console.log("main starts working");
    await new Promise(resolve => window.setTimeout(resolve, 5000));
    console.log("main ended working");
}
