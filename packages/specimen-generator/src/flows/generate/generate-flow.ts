/**
 * PURPOSE: Routes a generator command to the one responder that runs it. The generator has a single
 * command, so this holds wiring only.
 *
 * USAGE:
 * GenerateFlow({ argv: ['--check'], repoRoot: '/repo' });
 * // Returns { exitCode, output } from the responder
 */
import type { GenerateRunResult } from '../../contracts/generate-run-result/generate-run-result-contract';
import { GenerateRunResponder } from '../../responders/generate/run/generate-run-responder';

export const GenerateFlow = ({
  argv,
  repoRoot,
}: {
  argv: readonly string[];
  repoRoot: string;
}): GenerateRunResult => GenerateRunResponder({ argv, repoRoot });
