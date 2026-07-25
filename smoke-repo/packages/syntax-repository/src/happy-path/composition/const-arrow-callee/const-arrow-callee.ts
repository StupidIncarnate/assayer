const classify = (n: number): string => {
  if (n > 3) {
    return 'big';
  }

  return 'small';
};

export const report = (n: number): string => classify(n);
