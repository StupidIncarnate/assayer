export interface Settings {
  label: string;
  timeout: number;
}

export function withDefaults(settings: Settings): Settings {
  return settings;
}
