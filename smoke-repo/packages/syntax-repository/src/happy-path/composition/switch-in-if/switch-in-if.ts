export function route(enabled: boolean, method: 'get' | 'post'): string {
  if (enabled) {
    switch (method) {
      case 'get':
        return 'read';
      default:
        return 'other';
    }
  }

  return 'disabled';
}
