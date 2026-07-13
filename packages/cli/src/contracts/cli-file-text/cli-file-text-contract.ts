/**
 * PURPOSE: Branded contract for the raw text contents of a file the integration harness reads
 *   back off disk to assert against — e.g. the generated assayer.config.json bytes or a rebuilt
 *   cache manifest. Distinct from CliOutput (which is text the CLI emits to stdout).
 *
 * USAGE:
 * cliFileTextContract.parse('{"version":"1","repoRoot":".","exclude":[]}');
 * // Returns a branded CliFileText
 */
import { z } from 'zod';

export const cliFileTextContract = z.string().brand<'CliFileText'>();

export type CliFileText = z.infer<typeof cliFileTextContract>;
