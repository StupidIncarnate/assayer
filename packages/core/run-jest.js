/**
 * PURPOSE: The entry of the worker process that runs the nested Jest. `runExecuteCasesBroker` forks it
 *   through the node gateway's `forkWorker`, once per module format. The ESM worker starts with
 *   `--experimental-vm-modules`, because Jest runs an ES module only through `vm.SourceTextModule` and
 *   Node turns that on only from a process's own command line. The CommonJS worker starts without it,
 *   because the flag slows every run. This file is the same for both: only the Node flags differ. Each
 *   worker serves every run of its format in a batch, so Jest, ts-jest and the format's ts-jest
 *   compiler start once.
 *
 *   Each request is `{ id, message }`, and `message` is `{ config, testPathPattern, rootDir, tree }`:
 *   the inline JSON config, the pattern that names this one run, the project root, and which tree of
 *   core the run loads. Requests run one at a time, in the order they arrive, because the nested Jest
 *   runs in band. Each reply is `{ id, reply }`, where `reply` is `{ passed }` or, when Jest itself
 *   throws, `{ crashed }` with the error's stack.
 *
 *   A run of core's TypeScript `source` tree registers tsx first, once. The probe transformer is loaded
 *   by ts-jest with Node's own `require`, outside Jest's module system, and in the source tree the
 *   transformer's module is TypeScript. A `dist` run never loads tsx.
 *
 *   The worker exits when its parent disconnects, so it never outlives the process that forked it.
 *
 * USAGE:
 * // forkWorker({ modulePath: '<core>/run-jest.js', execArgv: coreRuntimeStatics.workerExecArgv[format] })
 */
const { runCLI } = require('@jest/core');

const state = { queue: Promise.resolve(), tsxRegistered: false };

process.on('message', ({ id, message }) => {
  state.queue = state.queue.then(async () => {
    if (message.tree === 'source' && !state.tsxRegistered) {
      require('tsx/cjs/api').register();
      state.tsxRegistered = true;
    }

    try {
      // `_` and `$0` are yargs' required positionals. `_` carries the test-path pattern, the one place
      // this run is named, which is what lets the config stay identical between runs.
      const { results } = await runCLI(
        { _: [message.testPathPattern], $0: '', config: message.config, runInBand: true, silent: true, ci: true },
        [message.rootDir],
      );

      process.send({ id, reply: { passed: results.success } });
    } catch (error) {
      process.send({ id, reply: { crashed: error instanceof Error ? String(error.stack) : String(error) } });
    }
  });
});

process.on('disconnect', () => {
  process.exit(0);
});
