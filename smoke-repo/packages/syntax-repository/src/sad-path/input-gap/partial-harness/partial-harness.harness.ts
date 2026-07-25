import { assayerHarness } from '@assayer/core';

assayerHarness({ inputs: { record: { log: (message: string): string => `logged:${message}` } } });
