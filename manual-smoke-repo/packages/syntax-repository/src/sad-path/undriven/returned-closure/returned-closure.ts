export function makeClassifier(threshold: number): (n: number) => string {
  return (n) => {
    if (n > threshold) {
      return 'big';
    }

    return 'small';
  };
}
