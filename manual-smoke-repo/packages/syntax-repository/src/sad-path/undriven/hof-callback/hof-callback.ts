function apply(n: number, cb: (x: number) => number): number {
  return cb(n);
}

export function run(value: number): number {
  return apply(value, (x) => {
    if (x > 5) {
      return x * 2;
    }

    return x;
  });
}
