export function record(
  size: number,
  log: (message: string) => string,
  sink: (line: string) => string,
): string {
  if (size > 10) {
    return sink(log('over'));
  }

  return sink(log('under'));
}
