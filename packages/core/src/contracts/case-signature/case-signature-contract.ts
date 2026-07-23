/**
 * PURPOSE: Contract for a case signature — the de-duplication key of a derived case: its exit plus the
 *   JSON of its arrange bindings. Two cases share a signature exactly when they set the SAME inputs and
 *   reach the SAME exit, so identical buckets render once and the salient representative stays stable.
 *
 * USAGE:
 * caseSignatureContract.parse('f/return@top::[{"kind":"param","param":"size","value":51}]');
 * // Returns a validated CaseSignature (branded)
 */
import { z } from 'zod';

export const caseSignatureContract = z.string().min(1).brand<'CaseSignature'>();

export type CaseSignature = z.infer<typeof caseSignatureContract>;
