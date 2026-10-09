export function orElse(a: string | null, b: string): string {
  return a ?? b;
}
