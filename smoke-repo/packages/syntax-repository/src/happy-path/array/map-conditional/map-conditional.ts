export function rescale(items: number[]): number[] {
  return items.map((n) => {
    if (n > 100) {
      return n * 2 - 1;
    }

    if (n < 0) {
      return n * n + 10;
    }

    return n + 10;
  });
}
