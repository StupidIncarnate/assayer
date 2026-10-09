export type Settings = { mode: string };

export function readSettings(settings: Settings): string {
  if (settings) {
    return 'has';
  }

  return 'none';
}
