export function checkTypeof(target: string | number): string {
  if (typeof target === 'string') {
    return 'is-string';
  }

  return 'not-string';
}
