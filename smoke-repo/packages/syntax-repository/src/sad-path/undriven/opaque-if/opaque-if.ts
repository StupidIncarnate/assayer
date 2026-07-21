function decide(): boolean {
  return Math.random() > 0.5;
}

export function opaqueIf(): string {
  if (decide()) {
    return 'a';
  }

  return 'b';
}
