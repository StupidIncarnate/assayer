interface Config {
  mode: string;
  retries: number;
}

export function pick(cfg: Config): string {
  return cfg.mode;
}
