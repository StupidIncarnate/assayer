export const grader = {
  grade(score: number): string {
    if (score > 5) {
      return 'pass';
    }

    return 'fail';
  },
};
