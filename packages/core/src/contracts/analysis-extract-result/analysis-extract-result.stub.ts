import type { StubArgument } from '@dungeonmaster/shared/@types';

import { analysisExtractResultContract } from './analysis-extract-result-contract';
import type { AnalysisExtractResult } from './analysis-extract-result-contract';

export const AnalysisExtractResultStub = (
  { ...props }: StubArgument<AnalysisExtractResult> = {},
): AnalysisExtractResult => analysisExtractResultContract.parse({ success: true, functions: [], ...props });
