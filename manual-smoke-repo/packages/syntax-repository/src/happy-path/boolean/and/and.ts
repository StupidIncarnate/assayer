export function grade(score: number, bonus: number): string {
  if (score > 5 && bonus > 1) {
    return 'pass';
  }

  return 'fail';
}
