import type { StubArgument } from '@dungeonmaster/shared/@types';

import { coreRuntimeContract } from './core-runtime-contract';
import type { CoreRuntime } from './core-runtime-contract';

export const CoreRuntimeStub = ({ ...props }: StubArgument<CoreRuntime> = {}): CoreRuntime =>
  coreRuntimeContract.parse({
    tree: 'source',
    setupFile: '/core/probe-runtime.js',
    astTransformer: '/core/probe-transformer.js',
    registrar: '/core/harness-registrar.js',
    interpretCaseModule: '/core/src/adapters/jest/interpret-case/jest-interpret-case-adapter',
    resolveEntryModule: '/core/src/adapters/jest/resolve-entry/jest-resolve-entry-adapter',
    probeRuntimeModule: '/core/src/adapters/jest/probe-runtime/jest-probe-runtime-adapter',
    probeInjectModule: '/core/src/adapters/jest/probe-inject/jest-probe-inject-adapter',
    harnessModule: '/core/index',
    ...props,
  });
