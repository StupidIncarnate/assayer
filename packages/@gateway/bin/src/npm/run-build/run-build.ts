/**
 * PURPOSE: `npm run build`, either for the whole repo or scoped to one workspace package. Leave
 * `workspace` out to run the root build script. Reach for `npmRun` instead for any other npm command.
 *
 * USAGE:
 * const { exitCode, output } = await runBuild({ cwd: '/repo' });
 * // Runs npm run build
 * const scoped = await runBuild({ cwd: '/repo', workspace: '@scope/pkg' });
 * // Runs npm run build --workspace=@scope/pkg
 */

import { npmRun } from '../npm-run/npm-run';

export const runBuild = async ({
  cwd,
  workspace,
}: {
  cwd: string;
  workspace?: string;
}): Promise<{ exitCode: number; output: string }> => {
  const { exitCode, output } = await npmRun({
    args: workspace === undefined ? ['run', 'build'] : ['run', 'build', `--workspace=${workspace}`],
    cwd,
  });
  return { exitCode, output };
};
