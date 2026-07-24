interface Config {
  mode: string;
}

export function merge(config: Config, extra: number[]): number {
  if (config.mode === 'a') {
    return extra.concat([1]).length;
  }

  return extra.map((n) => n + 1).length;
}
