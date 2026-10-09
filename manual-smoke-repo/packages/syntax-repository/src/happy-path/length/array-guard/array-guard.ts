export function classify(xs: string[]): string {
  if (xs.length > 3) {
    return 'many';
  }

  return 'few';
}
