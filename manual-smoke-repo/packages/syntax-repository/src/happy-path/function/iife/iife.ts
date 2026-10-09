export const label = ((): string => {
  const size = Number(process.env.SIZE);

  if (size > 5) {
    return 'big';
  }

  return 'small';
})();
