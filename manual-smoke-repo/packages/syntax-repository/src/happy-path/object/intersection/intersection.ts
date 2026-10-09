export interface Ay {
  a: string;
}

export interface Bee {
  b: number;
}

export function combine(v: Ay & Bee): string {
  return v.a;
}
