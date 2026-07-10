import { formatGreeting } from '@smoke-repo/shared';

export function run(): void {
  process.stdout.write(formatGreeting('cli'));
}
