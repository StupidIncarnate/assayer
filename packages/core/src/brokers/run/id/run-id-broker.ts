/**
 * PURPOSE: Derives a run's id from the file it runs — the ONE place that decides what names a run.
 *
 *   It exists on its own because two callers need the same answer and must not each compute it: the
 *   runner names the directory it writes, and every reader (a saved status in the UI, a detail link)
 *   has to find that directory again knowing only the file. Two derivations of one id is two
 *   encodings of one concept, and they drift silently — the reader simply finds nothing and reports
 *   "never run" over a run that happened.
 *
 *   Keyed on relPath AND content: the path alone would collide across edits, so a stale run would
 *   answer for new code; the content alone would collide across files that happen to read the same.
 *
 * USAGE:
 * runIdBroker({ relPath: 'src/a.ts', source: 'export const a = 1;\n' });
 * // Returns a RunId — the same one, for the same bytes, forever
 */
import { runIdContract } from '@assayer/shared/contracts';
import type { RunId } from '@assayer/shared/contracts';

import { cryptoSha256Adapter } from '../../../adapters/crypto/sha256/crypto-sha256-adapter';

export const runIdBroker = ({ relPath, source }: { relPath: string; source: string }): RunId =>
  runIdContract.parse(String(cryptoSha256Adapter({ content: `${relPath}\n${source}` })));
