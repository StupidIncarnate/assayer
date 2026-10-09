export function audit(size: number, report: (message: string) => string): string {
  if (size > 10) {
    return report('over');
  }

  return report('under');
}
