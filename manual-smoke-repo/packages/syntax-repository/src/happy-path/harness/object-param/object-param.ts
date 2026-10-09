interface Sink {
  write: (line: string) => string;
}

export function emit(size: number, sink: Sink): string {
  if (size > 10) {
    return sink.write('over');
  }

  return sink.write('under');
}
