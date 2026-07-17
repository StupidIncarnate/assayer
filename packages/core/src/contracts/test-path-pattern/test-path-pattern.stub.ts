import { testPathPatternContract } from './test-path-pattern-contract';
import type { TestPathPattern } from './test-path-pattern-contract';

export const TestPathPatternStub = (
  { value }: { value: string } = { value: '/cache/runs/r1/' },
): TestPathPattern => testPathPatternContract.parse(value);
