import { compiledFileFetchBroker } from './compiled-file-fetch-broker';
import { compiledFileFetchBrokerProxy } from './compiled-file-fetch-broker.proxy';
import { CompiledFileViewStub, RelPathStub } from '@assayer/shared/contracts';

describe('compiledFileFetchBroker', () => {
  describe('successful fetch', () => {
    it('VALID: {relPath: packages/web/app.tsx} => returns that same CompiledFileView', async () => {
      const proxy = compiledFileFetchBrokerProxy();
      const fileView = CompiledFileViewStub({ relPath: 'packages/web/app.tsx' });
      proxy.setupFile({ relPath: 'packages/web/app.tsx', fileView });
      const relPath = RelPathStub({ value: 'packages/web/app.tsx' });

      const result = await compiledFileFetchBroker({ relPath });

      expect(result).toStrictEqual(fileView);
    });
  });
});
