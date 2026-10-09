const decide = (size: number): string => {
  if (size > 5) {
    return 'big';
  }

  return 'small';
};

export default decide;
