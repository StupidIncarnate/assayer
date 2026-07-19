declare function noop(): void;

export function tally(value: number, mode: string): number {
  if (value > 5) {
    switch (mode) {
      case 'a':
        break;
      default:
        noop();
    }
  }

  return 1;
}
