export function classify(n: number): string {
  const label = n > 5 ? 'big' : 'small';
  return label;
}
