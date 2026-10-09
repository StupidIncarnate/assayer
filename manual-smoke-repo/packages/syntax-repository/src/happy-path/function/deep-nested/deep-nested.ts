export function outer(value: number): string {
  return middle(value);
}

function middle(m: number): string {
  function inner(i: number): string {
    if (i > 10) {
      return 'big';
    }

    return 'small';
  }

  if (m > 5) {
    return inner(m);
  }

  return 'low';
}
