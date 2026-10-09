export interface Config {
  mode: string;
  region: string;
  retries: number;
}

export function withDefaults(config: Config): Config {
  return config;
}
