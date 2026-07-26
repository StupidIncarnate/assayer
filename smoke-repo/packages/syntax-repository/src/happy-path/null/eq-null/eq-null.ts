export function checkNull(v: string | null): string {
  if (v === null) {
    return 'is-null';
  }

  return 'not-null';
}
