const TARGET = 'a';

export const pick = (mode: string): number => {
  if (mode === TARGET) {
    return 1;
  }

  return 2;
};
