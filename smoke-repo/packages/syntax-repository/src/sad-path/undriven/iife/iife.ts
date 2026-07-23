export const label = ((n: number): string => {
  if (n > 5) {
    return 'big';
  }

  return 'small';
})(7);
