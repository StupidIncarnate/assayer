export function gate(ready: boolean): string {
  if (!ready) {
    return 'blocked';
  }

  return 'open';
}
