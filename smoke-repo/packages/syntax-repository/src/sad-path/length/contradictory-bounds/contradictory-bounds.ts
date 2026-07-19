export function tag(word: string): string {
  if (word.length < 1) {
    if (word.length > 1) {
      return 'impossible';
    }

    return 'empty';
  }

  return 'filled';
}
