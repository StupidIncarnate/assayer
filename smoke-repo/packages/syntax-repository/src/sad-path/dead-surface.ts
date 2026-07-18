function unused(value: number): string {
  if (value > 5) {
    return 'big';
  }

  return 'small';
}

export function greet(name: string): string {
  return 'Hello, ' + name;
}
