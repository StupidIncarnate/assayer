function decide(): boolean {
  return Math.random() > 0.5;
}

export function opaqueTernary(): string {
  return decide() ? 'a' : 'b';
}
