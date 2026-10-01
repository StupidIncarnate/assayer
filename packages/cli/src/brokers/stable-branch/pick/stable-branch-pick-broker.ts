/**
 * PURPOSE: Prompts the user to pick the stable branch used as Assayer's diff baseline, defaulting
 *   to the preselected candidate when the answer is empty or matches no candidate. The prompt goes
 *   through the readline gateway's `question`, which resolves the fallback when stdin reaches EOF
 *   before a line arrives (piped, closed, or `< /dev/null`), so a non-interactive run never waits
 *   for a line that will never come.
 *
 * USAGE:
 * await stableBranchPickBroker({
 *   candidates: [BranchNameStub({ value: 'main' }), BranchNameStub({ value: 'develop' })],
 *   preselected: BranchNameStub({ value: 'main' }),
 * });
 * // Prompts on stdin/stdout; returns the matched BranchName or the preselected one
 */
import { question } from '#gateway/node/readline';
import { getStdin, stdout } from '#gateway/node/process';
import { branchNameContract } from '@assayer/shared/contracts';
import type { BranchName } from '@assayer/shared/contracts';

export const stableBranchPickBroker = async ({
  candidates,
  preselected,
}: {
  candidates: readonly BranchName[];
  preselected: BranchName;
}): Promise<BranchName> => {
  const candidateLines = candidates
    .map((candidate) => `  ${candidate}${candidate === preselected ? ' (default)' : ''}`)
    .join('\n');
  const prompt =
    `Select the stable branch for Assayer's diff baseline:\n${candidateLines}\n` +
    `Enter branch name (press Enter for ${preselected}): `;

  const answer = await question({
    input: getStdin(),
    output: stdout,
    prompt,
    fallback: preselected,
  });
  const match = candidates.find((candidate) => candidate === answer);

  return branchNameContract.parse(match === undefined ? preselected : match);
};
