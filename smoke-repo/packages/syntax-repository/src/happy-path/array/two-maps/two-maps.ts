export function pipeline(xs: number[], ys: number[]): number[] {
  const scaled = xs.map((n) => {
    if (n > 100) {
      return n * 2;
    }
    return n;
  });
  const shifted = ys.map((m) => {
    if (m < 0) {
      return 0;
    }
    return m;
  });
  return scaled.concat(shifted);
}
