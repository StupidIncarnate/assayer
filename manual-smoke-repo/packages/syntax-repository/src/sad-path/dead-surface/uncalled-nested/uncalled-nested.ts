export function outer(value: number): number {
  function unused(n: number): number {
    if (n > 5) {
      return n * 2;
    }

    return n;
  }

  return value + 1;
}
