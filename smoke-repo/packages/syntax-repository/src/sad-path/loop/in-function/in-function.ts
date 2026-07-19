export function sumAll(items: number[]): number {
  let total = 0;

  for (const item of items) {
    total = total + item;
  }

  return total;
}
