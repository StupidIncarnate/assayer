import type { StubArgument } from '@dungeonmaster/shared/@types';

import { lineEnrichmentContract } from './line-enrichment-contract';
import type { LineEnrichment } from './line-enrichment-contract';

export const LineEnrichmentStub = ({ ...props }: StubArgument<LineEnrichment> = {}): LineEnrichment =>
  lineEnrichmentContract.parse({ line: 1, symbol: 'name', typeText: 'string', ...props });
