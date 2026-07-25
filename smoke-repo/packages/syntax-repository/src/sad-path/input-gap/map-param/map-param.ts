export function tally(size: number, counts: Map<string, number>): number {
  if (size > 10) {
    return counts.size;
  }

  return counts.size + 1;
}
