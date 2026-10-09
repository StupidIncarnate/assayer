export function classify(value: number): string {
  if (value >= 1) {
    return 'high';
  }

  if (value <= 1 || value === 0) {
    return 'low';
  }

  return 'impossible';
}
