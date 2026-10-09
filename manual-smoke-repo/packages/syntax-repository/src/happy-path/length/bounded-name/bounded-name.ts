export function tier(name: string): string {
  if (name.length >= 2 && name.length <= 5) {
    return 'short';
  }

  return 'other';
}
