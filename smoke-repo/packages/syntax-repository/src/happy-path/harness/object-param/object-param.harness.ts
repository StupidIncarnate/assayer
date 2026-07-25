import { assayerHarness } from '@assayer/core';

assayerHarness({ inputs: { emit: { sink: { write: (line: string): string => `emitted:${line}` } } } });
