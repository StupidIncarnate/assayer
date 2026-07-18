function decide(value: number): string {
  if (value > 5) {
    return 'big';
  }

  return 'small';
}

export function report(value: number): string {
  return decide(3);
}
