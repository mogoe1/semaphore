import { Semaphore } from "../lib/Semaphore.js";

self.addEventListener("message", message => {
    const buffer = message.data;
    const sem = new Semaphore(new Int32Array(buffer));
    sem.acquire(1); // this blocks the worker thread untill one permit is acquired!
    // exclusive access to resource
    console.log("hi from worker");
    sem.release(1);
});
