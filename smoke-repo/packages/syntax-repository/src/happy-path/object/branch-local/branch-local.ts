interface Config {
  mode: string;
}

export function decide(config: Config): string {
  if (config.mode === 'a') {
    return 'x';
  }

  return 'y';
}
