export function route(admin: boolean, level: number, owner: boolean): string {
  if (admin && (level > 3 || owner)) {
    return 'allow';
  }

  return 'deny';
}
