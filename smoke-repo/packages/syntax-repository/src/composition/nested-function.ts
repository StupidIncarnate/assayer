export function outer(value: number): string {
  function inner(n: number): string {
    if (n > 5) {
      return 'inner big';
    }

    return 'inner small';
  }

  return inner(value);
}
