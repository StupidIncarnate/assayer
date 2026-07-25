export type Box<T> = { value: T };

export const rewrap = (box: Box<number>): Box<number> => box;
