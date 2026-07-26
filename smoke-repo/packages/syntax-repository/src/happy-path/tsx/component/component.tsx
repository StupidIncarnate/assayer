export const Badge = (label: string, urgent: boolean): JSX.Element => {
  if (urgent) {
    return <strong>{label}</strong>;
  }

  return <span>{label}</span>;
};
