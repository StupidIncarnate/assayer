export const classify = function (n: number): string {
  if (n > 5) {
    return 'big';
  }

  return 'small';
};
