export function bandReading(n: number): string {
  if (n >= 80) {
    return 'high';
  }

  if (n < 20) {
    return 'low';
  }

  return 'mid';
}
