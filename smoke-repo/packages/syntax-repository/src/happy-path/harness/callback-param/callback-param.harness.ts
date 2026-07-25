import { assayerHarness } from '@assayer/core';

assayerHarness({ inputs: { audit: { report: (message: string): string => `audited:${message}` } } });
