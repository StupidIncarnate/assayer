export function bucket(size: number): string {
  if (size > 100) {
    return 'large';
  }

  if (size > 10) {
    return 'medium';
  }

  return 'small';
}
