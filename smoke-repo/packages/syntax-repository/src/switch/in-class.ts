export class Router {
  routeLabel(method: 'get' | 'post' | 'delete'): string {
    switch (method) {
      case 'get':
        return 'read';
      case 'post':
        return 'create';
      default:
        return 'other';
    }
  }
}
