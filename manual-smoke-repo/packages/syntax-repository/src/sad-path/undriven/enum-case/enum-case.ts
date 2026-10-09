enum Severity {
  Low = 'low',
  High = 'high',
}

export const rank = (severity: Severity): number => {
  switch (severity) {
    case Severity.Low:
      return 1;
    default:
      return 2;
  }
};
