export function check(active: boolean): string {
  if (active === false) {
    return 'inactive';
  }

  return 'active';
}
