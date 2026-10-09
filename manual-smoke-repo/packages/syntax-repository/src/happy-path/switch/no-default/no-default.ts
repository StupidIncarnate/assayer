function noop(): void {
  void 0;
}

export function routeLabel(method: 'get' | 'post'): void {
  switch (method) {
    case 'get':
      noop();
      break;
    case 'post':
      noop();
      break;
  }
}
