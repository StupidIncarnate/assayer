import type { StubArgument } from '@dungeonmaster/shared/@types';

import { assayerConfigContract } from './assayer-config-contract';
import type { AssayerConfig } from './assayer-config-contract';

export const AssayerConfigStub = ({ ...props }: StubArgument<AssayerConfig> = {}): AssayerConfig =>
  assayerConfigContract.parse({ version: '1', repoRoot: '.', exclude: [], ...props });
