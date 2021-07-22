# Semaphore
A semaphore designed for multi-threaded browser environments.

## Installing
<strike> `npm install @mogoe1/semaphore` </strike> (we are not on npm yet)

	npm install git+https://github.com/mogoe1/semaphore.git

## Notes
* The implementation relies on SharedArrayBuffers. Make sure your site meets the [security requirements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements).
* The implementation relies on Atomics.waitAsync which is implemented by [v8](https://v8.dev/features/atomics) but not documented at mdn yet. You might want to proivide a [polyfill](https://github.com/tc39/proposal-atomics-wait-async/blob/master/polyfill.js).

## Quickstart
The following example shows how a samaphore can be used to make sure only one thrad at a time has access to a shared ressource.

```js
// file: main.js
import { Semaphore } from "@mogoe1/semaphore";

const sem = Semaphore.createWithCapacity(1);
const worker = new Worker("worker.js", {type: "module"});

worker.postMessage(sem.buffer);

sem.acquireAsync(1).then(_=>{
	// exclusive access to resource
	sem.release(1);
});
```

```js
// file: worker.js
import { Semaphore } from "@mogoe1/semaphore";

self.addEventListener("message", message => {
    const buffer = message.data;
    const sem = new Semaphore(new Int32Array(buffer));
    sem.acquire(1); // this blocks the worker thread untill one permit is acquired!
    // exclusive access to resource
    sem.release(1);
});
```

## Docs
Docs are availabe at https://mogoe1.github.io/semaphore/index.html.