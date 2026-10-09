function readValue(): unknown {
  return Math.random();
}

export function checkKind(): string {
  if (typeof readValue() === 'string') {
    return 'is-string';
  }

  return 'not-string';
}
