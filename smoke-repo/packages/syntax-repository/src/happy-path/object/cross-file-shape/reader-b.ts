import { Config } from './types';

export function decideB(config: Config): string {
  if (config.region === 'us') {
    return 'p';
  }

  return 'q';
}
