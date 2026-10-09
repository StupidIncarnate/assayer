function decide(value: number): string {
  if (value > 5) {
    return 'big';
  }

  return 'small';
}

export function report(): string {
  return decide(3);
}
