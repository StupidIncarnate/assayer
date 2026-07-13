/**
 * PURPOSE: Contract for a code-gutter marker — one source line paired with the number of derived
 *   test cases whose coverage runs through it. Drives the code-viewer's per-line test-count gutter.
 *
 * USAGE:
 * gutterMarkerContract.parse({ line: 2, count: 2 });
 * // Returns a validated GutterMarker (branded line + count)
 */
import { z } from 'zod';

import { lineNumberContract } from '@assayer/shared/contracts';

export const gutterMarkerContract = z.object({
  line: lineNumberContract,
  count: z.number().int().positive().brand<'TestCaseCount'>(),
});

export type GutterMarker = z.infer<typeof gutterMarkerContract>;
