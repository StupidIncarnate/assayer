export function hasEntries(tags: string[]): string {
  if (tags) {
    return 'has';
  }

  return 'none';
}
