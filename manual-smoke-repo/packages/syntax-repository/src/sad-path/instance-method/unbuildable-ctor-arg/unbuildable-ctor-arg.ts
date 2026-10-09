export class Repo {
  constructor(private readonly report: (message: string) => string) {}

  find(id: number): string {
    if (id > 0) {
      return 'hit';
    }

    return 'miss';
  }
}
