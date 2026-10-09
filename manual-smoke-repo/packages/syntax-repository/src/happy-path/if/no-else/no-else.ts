function noop(): void {
  void 0;
}

export function classify(value: number): void {
  if (value > 5) {
    noop();
  }
}
