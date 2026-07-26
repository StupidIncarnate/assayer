/**
 * PURPOSE: Branded contract for one rendered admission row — a GAP, DARK spot, UNDRIVEN entry, or
 *   LINT — spelled `<MARKER> <subject> — <text>` with one space after the marker. One brand for all
 *   four because they are joined into a single line list and printed by the same two surfaces
 *   (`assayer unit`, `assayer detail`), never distinguished by type once rendered.
 *
 * USAGE:
 * admissionLineContract.parse('  GAP find — needs a harness');
 * // Returns a branded AdmissionLine
 */
import { z } from 'zod';

export const admissionLineContract = z.string().min(1).brand<'AdmissionLine'>();

export type AdmissionLine = z.infer<typeof admissionLineContract>;
