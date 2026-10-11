const doThing = (): string => 'done';

export const run = (flag: boolean): void => {
  if (flag) doThing();
};
