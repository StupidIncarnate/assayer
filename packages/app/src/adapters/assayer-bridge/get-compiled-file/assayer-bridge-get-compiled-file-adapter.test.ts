import { assayerBridgeGetCompiledFileAdapter } from './assayer-bridge-get-compiled-file-adapter';
import { assayerBridgeGetCompiledFileAdapterProxy } from './assayer-bridge-get-compiled-file-adapter.proxy';
import { CompiledFileViewStub, RelPathStub } from '@assayer/shared/contracts';

describe('assayerBridgeGetCompiledFileAdapter', () => {
  describe('reading a compiled file view', () => {
    it('VALID: {relPath: "packages/web/app.tsx"} => returns the CompiledFileView registered for that path', async () => {
      const proxy = assayerBridgeGetCompiledFileAdapterProxy();
      const fileView = CompiledFileViewStub({ relPath: 'packages/web/app.tsx' });
      proxy.register({ relPath: 'packages/web/app.tsx', fileView });
      const relPath = RelPathStub({ value: 'packages/web/app.tsx' });

      const result = await assayerBridgeGetCompiledFileAdapter({ relPath });

      expect(result).toStrictEqual(fileView);
    });

    it('VALID: {relPath: "packages/web/other.tsx"} => resolves the view for that path, not the first registered path', async () => {
      const proxy = assayerBridgeGetCompiledFileAdapterProxy();
      const fileViewA = CompiledFileViewStub({ relPath: 'packages/web/app.tsx' });
      const fileViewB = CompiledFileViewStub({ relPath: 'packages/web/other.tsx' });
      proxy.register({ relPath: 'packages/web/app.tsx', fileView: fileViewA });
      proxy.register({ relPath: 'packages/web/other.tsx', fileView: fileViewB });
      // Requests the SECOND registered path. A lookup that ignored relPath and always answered with
      // whichever view was registered first would return fileViewA here and this assertion would catch
      // it; requesting the first-registered path (as this test used to) cannot tell the two apart.
      const relPath = RelPathStub({ value: 'packages/web/other.tsx' });

      const result = await assayerBridgeGetCompiledFileAdapter({ relPath });

      expect(result).toStrictEqual(fileViewB);
    });
  });

  describe('when the preload bridge is absent', () => {
    it('ERROR: {window.assayerBridge.getCompiledFile undefined} => throws an actionable preload-unavailable error', async () => {
      const proxy = assayerBridgeGetCompiledFileAdapterProxy();
      proxy.absent();

      await expect(assayerBridgeGetCompiledFileAdapter({ relPath: RelPathStub({ value: 'x' }) })).rejects.toThrow(
        /^Assayer preload bridge unavailable: window\.assayerBridge was not exposed by the Electron preload\./u,
      );
    });
  });
});
