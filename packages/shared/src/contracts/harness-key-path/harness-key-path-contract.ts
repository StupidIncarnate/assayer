/**
 * PURPOSE: Contract for a harness KEY PATH — the dotted route to one declared value inside a loaded
 *   harness declaration (`inputs.<entry>.<param>`). It is what an arrange binding carries instead of a
 *   value: the value is a callback that does not serialize, so the case names WHERE to find it and the
 *   run reads it out of the declaration the harness registered.
 *
 *   Written as a PATH rather than as an (entry, parameter) pair because a human reads it as often as
 *   the interpreter walks it: it appears verbatim in the case's arrange text and in the message an
 *   unmet key produces, and `inputs.audit.report` is exactly what the author typed in the harness file.
 *
 * USAGE:
 * harnessKeyPathContract.parse('inputs.audit.report');
 * // Returns a validated HarnessKeyPath (branded)
 */
import { z } from '#gateway/npm/zod';

export const harnessKeyPathContract = z.string().min(1).brand<'HarnessKeyPath'>();

export type HarnessKeyPath = z.infer<typeof harnessKeyPathContract>;
