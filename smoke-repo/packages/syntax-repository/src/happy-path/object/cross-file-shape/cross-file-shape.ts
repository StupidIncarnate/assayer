import { Config } from './types';

export function decideA(config: Config): string {
  if (config.mode === 'a') {
    return 'x';
  }

  return 'y';
}
