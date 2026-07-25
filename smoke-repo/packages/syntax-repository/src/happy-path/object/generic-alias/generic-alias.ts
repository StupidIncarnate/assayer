import type { Box } from './box';

export const openBox = (box: Box<string>): string => box.value;
