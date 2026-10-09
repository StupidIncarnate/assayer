export function pickByLength(someArr: number[]): number | undefined {
  const some = someArr.length;
  return [10, 20, 30].at(some);
}
