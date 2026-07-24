export function scaleAndAppend(values: number[], extra: number[]): number[] {
  const scaled = values.map((n) => {
    if (n > 100) {
      return n * 2;
    }
    return n;
  });
  return scaled.concat(extra);
}
