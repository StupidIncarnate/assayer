/**
 * PURPOSE: Prompts the user via readline to pick the stable branch used as Assayer's diff
 *   baseline, defaulting to the preselected candidate when the answer is empty or unmatched.
 *
 * USAGE:
 * await readlineStableBranchPickAdapter({
 *   candidates: [BranchNameStub({ value: 'main' }), BranchNameStub({ value: 'develop' })],
 *   preselected: BranchNameStub({ value: 'main' }),
 * });
 * // Prompts on stdin/stdout; returns the matched BranchName or the preselected one
 */
import { createInterface } from 'readline';
import { branchNameContract } from '@assayer/shared/contracts';
import type { BranchName } from '@assayer/shared/contracts';

export const readlineStableBranchPickAdapter = async ({
  candidates,
  preselected,
}: {
  candidates: readonly BranchName[];
  preselected: BranchName;
}): Promise<BranchName> => {
  const promptText =
    `Select the stable branch for Assayer's diff baseline:\n${ 
    candidates
      .map((candidate) => `  ${candidate}${candidate === preselected ? ' (default)' : ''}`)
      .join('\n') 
    }\nEnter branch name (press Enter for ${ 
    preselected 
    }): `;

  process.stdout.write(promptText);

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve: (rawAnswer: string) => void) => {
    rl.question('', resolve);
  });
  rl.close();

  const trimmed = answer.trim();
  const match = candidates.find((candidate) => candidate === trimmed);

  return match === undefined ? branchNameContract.parse(preselected) : branchNameContract.parse(match);
};
