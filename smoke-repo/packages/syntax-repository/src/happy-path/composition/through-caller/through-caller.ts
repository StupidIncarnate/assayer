const classify = (n: number): string => {
  if (n > 5) {
    return 'big';
  }

  return 'small';
};

export const report = (n: number): void => {
  classify(n);
};
