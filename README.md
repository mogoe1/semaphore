# Semaphore
A semaphore designed for multi-threaded browser environments.

## Installing

	bun add github:mogoe1/semaphore#<tag>

Replace the tag with the version you want, see [Releases](https://github.com/mogoe1/semaphore/releases). Tags contain the built `lib/` folder; the `main` branch does not.

## Development
Install dependencies with `bun install`, then run `bun run build`, `bun run lint`, and `bun run format:check`.

## Releasing
1. Bump `version` in `package.json` and merge it to `main`.
2. Run the **Release** workflow on `main` (Actions tab). It checks the code, builds `lib/`, pushes the tag `v<version>` with the build output and creates a GitHub release.

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