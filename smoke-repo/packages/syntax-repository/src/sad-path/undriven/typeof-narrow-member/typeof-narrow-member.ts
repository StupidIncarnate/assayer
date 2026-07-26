interface Plain {
  label: string;
}

export const choose = (target: Plain | string): string => (typeof target === 'string' ? target : target.label);
