interface Config {
  db: { retry: number };
}

export function checkDeep(config: Config): string {
  if (config.db.retry === 3) {
    return 'x';
  }

  return 'y';
}
