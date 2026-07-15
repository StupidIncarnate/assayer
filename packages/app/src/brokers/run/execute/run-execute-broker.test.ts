import { RunResultStub, RelPathStub } from '@assayer/shared/contracts';

import { runExecuteBroker } from './run-execute-broker';
import { runExecuteBrokerProxy } from './run-execute-broker.proxy';

describe('runExecuteBroker', () => {
  describe('running a file', () => {
    it('VALID: {a file} => the run the CLI produced', async () => {
      const proxy = runExecuteBrokerProxy();
      proxy.setupRun({ run: RunResultStub() });

      const result = await runExecuteBroker({ relPath: RelPathStub({ value: 'src/a.ts' }) });

      expect(result).toStrictEqual(RunResultStub());
    });
  });

  describe('a run that could not happen', () => {
    it('ERROR: {the main process refused} => the message reaches the caller', async () => {
      const proxy = runExecuteBrokerProxy();
      proxy.fails({ message: 'assayer: the CLI is not built, so nothing can be run.' });

      await expect(runExecuteBroker({ relPath: RelPathStub({ value: 'src/a.ts' }) })).rejects.toThrow(
        /the CLI is not built/u,
      );
    });
  });
});
