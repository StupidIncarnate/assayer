import { bandReading } from './band-reading';

export function bandReadings(items: number[]): string[] {
  return items.map(bandReading);
}
