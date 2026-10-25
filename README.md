# Semaphore
A semaphore designed for multi-threaded browser environments.

## Installing

The library is not yet published to npm, so it cannot be installed with `npm install @mogoe1/semaphore`.

	bun add github:mogoe1/semaphore#<tag>

Replace the tag with the version you want, see [Releases](https://github.com/mogoe1/semaphore/releases). Tags contain the built `lib/` folder; the `main` branch does not.

The package is ESM only:

	import { Semaphore } from "@mogoe1/semaphore";

## Development
Install dependencies with `bun install`, then run `bun run typecheck`, `bun run test`, `bun run lint`, `bun run format:check`, and `bun run build`.

## Releasing
1. Bump `version` in `package.json` and merge it to `main`.
2. Run the **Release** workflow on `main` (Actions tab). It checks the code, builds `lib/`, pushes the tag `v<version>` with the build output and creates a GitHub release.

## Notes
* The implementation relies on SharedArrayBuffers. Make sure your site meets the [security requirements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements).
* The semaphore does not guarantee fairness or FIFO ordering. Waiting calls are not necessarily served in the order in which they started waiting.

## Quickstart
The following example shows how a semaphore can be used to make sure only one thread at a time has access to a shared resource.

```js
// file: main.js
import { Semaphore } from "@mogoe1/semaphore";

const sem = Semaphore.createWithInitialCapacity(1);
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
    sem.acquire(1); // this blocks the worker thread until one permit is acquired!
    // exclusive access to resource
    sem.release(1);
});
```