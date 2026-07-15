export function alarmLevel(temp: number, smoke: boolean): string {
  if (temp > 50 || smoke) {
    return 'alarm';
  }

  return 'calm';
}
