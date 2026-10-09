function label(s: string): string {
  return s;
}

export function pick(n: number): string {
  return label(n > 5 ? 'big' : 'small');
}
