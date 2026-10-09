export function describeRoute(method: 'get' | 'post', size: number): string {
  switch (method) {
    case 'get':
      if (size > 5) {
        return 'big read';
      }

      return 'small read';
    default:
      return 'other';
  }
}
