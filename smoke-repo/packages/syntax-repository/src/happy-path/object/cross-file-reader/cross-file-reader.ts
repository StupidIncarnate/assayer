import { Settings } from './settings';

export function readTimeout(settings: Settings): number {
  return settings.timeout;
}
