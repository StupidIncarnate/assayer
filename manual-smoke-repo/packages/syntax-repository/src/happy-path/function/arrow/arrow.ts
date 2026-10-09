export const grade = (n: number): string => {
  if (n > 5) {
    return 'high';
  }

  return 'low';
};
