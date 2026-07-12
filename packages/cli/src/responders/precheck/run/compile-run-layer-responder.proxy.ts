import { registerMock } from '@dungeonmaster/testing/register-mock';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import { configHashBroker, manifestLoadBroker, manifestTrashBroker, compileRunBroker } from '@assayer/core/brokers';
import {
  configHashBrokerProxy,
  manifestLoadBrokerProxy,
  manifestTrashBrokerProxy,
  compileRunBrokerProxy,
} from '@assayer/core/testing';
import type { AssayerCacheManifestStub, CompileResultStub } from '@assayer/shared/contracts';
import { contentHashContract, compileResultContract } from '@assayer/shared/contracts';

import { processStdoutCompileProgressAdapterProxy } from '../../../adapters/process-stdout/compile-progress/process-stdout-compile-progress-adapter.proxy';

type AssayerCacheManifest = ReturnType<typeof AssayerCacheManifestStub>;
type CompileResultErrors = ReturnType<typeof CompileResultStub>['errors'];

export const CompileRunLayerResponderProxy = (): {
  configHashReturns: () => void;
  manifestMissing: () => void;
  manifestInvalid: () => void;
  manifestOk: (params: { manifest: AssayerCacheManifest }) => void;
  trashSucceeds: () => void;
  compileSucceeds: () => void;
  compileFails: (params: { errors: CompileResultErrors }) => void;
  getCallOrder: () => unknown[];
  wasTrashCalled: () => boolean;
  wasCompileCalled: () => boolean;
} => {
  // The @assayer/core/testing composed proxies below are instantiated to satisfy
  // enforce-proxy-child-creation, but the cross-package registerMock chain they wire up
  // cannot intercept real I/O here — the ts-jest proxy-mock AST collector only resolves
  // relative imports (see importPathResolverMiddleware in @dungeonmaster/testing), so it
  // never walks into a bare "@assayer/core/testing" specifier to find the registerMock
  // calls nested inside core's own adapter proxies. Mocking the broker functions directly
  // below (same-file imports the transformer CAN see) is what actually drives this test's
  // behavior — see stable-branch-layer-responder.proxy.ts for the same gotcha.
  configHashBrokerProxy();
  manifestLoadBrokerProxy();
  manifestTrashBrokerProxy();
  compileRunBrokerProxy();
  processStdoutCompileProgressAdapterProxy();

  const configHashHandle = registerMock({ fn: configHashBroker });
  const manifestLoadHandle = registerMock({ fn: manifestLoadBroker });
  const manifestTrashHandle = registerMock({ fn: manifestTrashBroker });
  const compileRunHandle = registerMock({ fn: compileRunBroker });

  const callOrder: unknown[] = [];

  configHashHandle.mockReturnValue(
    contentHashContract.parse('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'),
  );
  manifestTrashHandle.mockImplementation(async () => {
    callOrder.push('trash');

    return Promise.resolve({ success: true });
  });

  return {
    configHashReturns: (): void => undefined,
    manifestMissing: (): void => {
      manifestLoadHandle.mockResolvedValueOnce({ status: 'missing' });
    },
    manifestInvalid: (): void => {
      manifestLoadHandle.mockResolvedValueOnce({
        status: 'invalid',
        reason: errorMessageContract.parse('manifest failed schema validation'),
      });
    },
    manifestOk: ({ manifest }: { manifest: AssayerCacheManifest }): void => {
      manifestLoadHandle.mockResolvedValueOnce({ status: 'ok', manifest });
    },
    trashSucceeds: (): void => undefined,
    compileSucceeds: (): void => {
      compileRunHandle.mockImplementationOnce(async () => {
        callOrder.push('compile');

        return Promise.resolve(compileResultContract.parse({ status: 'ok', results: [], errors: [] }));
      });
    },
    compileFails: ({ errors }: { errors: CompileResultErrors }): void => {
      compileRunHandle.mockImplementationOnce(async () => {
        callOrder.push('compile');

        return Promise.resolve(compileResultContract.parse({ status: 'errors', results: [], errors }));
      });
    },
    getCallOrder: (): unknown[] => callOrder,
    wasTrashCalled: (): boolean => manifestTrashHandle.mock.calls.length > 0,
    wasCompileCalled: (): boolean => compileRunHandle.mock.calls.length > 0,
  };
};
