// file: main.js
import { Semaphore } from "../lib/Semaphore.js";

const sem = Semaphore.createWithCapacity(1);
const worker = new Worker("worker.js", { type: "module" });

worker.postMessage(sem.buffer);

sem.acquireAsync(1).then(_ => {
    // exclusive access to resource
    console.log("hi from main");
    window.setTimeout(() => { sem.release(1); }, 5000);
});
