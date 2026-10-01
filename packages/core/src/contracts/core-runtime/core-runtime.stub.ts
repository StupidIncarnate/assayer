import type { StubArgument } from '@dungeonmaster/shared/@types';

import { coreRuntimeContract } from './core-runtime-contract';
import type { CoreRuntime } from './core-runtime-contract';

export const CoreRuntimeStub = ({ ...props }: StubArgument<CoreRuntime> = {}): CoreRuntime =>
  coreRuntimeContract.parse({
    tree: 'source',
    setupFile: '/core/probe-runtime.js',
    astTransformer: '/core/probe-transformer.js',
    registrar: '/core/harness-registrar.js',
    compiler: '/core/bundled-typescript.js',
    interpretCaseModule: '/core/src/brokers/case/interpret/case-interpret-broker',
    resolveEntryModule: '/core/src/brokers/case/resolve-entry/case-resolve-entry-broker',
    probeRuntimeModule: '/core/src/brokers/probe-runtime/create/probe-runtime-create-broker',
    probeInjectModule: '/core/src/transformers/probe-inject/probe-inject-transformer',
    harnessModule: '/core/index',
    ...props,
  });
