function tooBig(n: number): boolean {
  return n > 50;
}

export function classify(x: number): string {
  if (tooBig(x)) {
    return 'big';
  }

  return 'small';
}
