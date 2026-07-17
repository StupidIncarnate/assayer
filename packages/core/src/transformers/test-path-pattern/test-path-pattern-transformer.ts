/**
 * PURPOSE: Turns a run's directory into the test-path pattern Jest selects that run by.
 *
 *   Escaped, because Jest matches these as REGEXES while a run directory is a path: an unescaped `.`
 *   — as in `.assayer` — matches any character, so the pattern would quietly select a directory
 *   nobody asked for. The trailing separator anchors the end, so a run whose id merely starts with
 *   another's cannot be caught by it: `r1` must not select `r10`.
 *
 *   It exists so the runner's Jest config can stay IDENTICAL from file to file, with only this
 *   pattern naming the run. ts-jest keeps one TypeScript compiler per distinct config and never
 *   releases it, so a config that named each run's own directory stranded a whole compiler per file.
 *
 * USAGE:
 * testPathPatternTransformer({ runDir: '/cache/.assayer/runs/r1' });
 * // Returns '/cache/\\.assayer/runs/r1/'
 */
import { testPathPatternContract } from '../../contracts/test-path-pattern/test-path-pattern-contract';
import type { TestPathPattern } from '../../contracts/test-path-pattern/test-path-pattern-contract';

export const testPathPatternTransformer = ({ runDir }: { runDir: string }): TestPathPattern =>
  testPathPatternContract.parse(`${runDir.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}/`);
