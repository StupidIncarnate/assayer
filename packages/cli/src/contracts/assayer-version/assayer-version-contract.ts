/**
 * PURPOSE: Branded contract for the assayer CLI's own semantic version string.
 *
 * USAGE:
 * assayerVersionContract.parse('1.0.0');
 * // Returns a branded AssayerVersion
 */
import { z } from 'zod';

export const assayerVersionContract = z.string().min(1).brand<'AssayerVersion'>();

export type AssayerVersion = z.infer<typeof assayerVersionContract>;
