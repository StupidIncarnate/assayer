interface Marker {
  label: string;
}

export function pick(target: Marker | string, count: number): number {
  if (count > 1) {
    return count;
  }

  return 0;
}
