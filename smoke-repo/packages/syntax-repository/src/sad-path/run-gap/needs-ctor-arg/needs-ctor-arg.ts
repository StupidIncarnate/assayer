export function tally(value: number): number {
  return value + 1;
}

export class Repo {
  constructor(private readonly url: string) {}

  find(id: number): string {
    if (id > 0) {
      return 'hit';
    }

    return 'miss';
  }
}
