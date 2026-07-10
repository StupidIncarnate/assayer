/**
 * PURPOSE: Converts a 0-based character offset into JSON text (e.g. the "position N" reported
 *   by JSON.parse errors) into a 1-based { line, column } source position.
 *
 * USAGE:
 * jsonParseErrorPositionTransformer({ text: '{\n  "a": 1\n}', offset: 10 });
 * // Returns { line: 2, column: 9 } -- offset 10 is the newline ending line 2
 */
import { sourcePositionContract } from '../../contracts/source-position/source-position-contract';
import type { SourcePosition } from '../../contracts/source-position/source-position-contract';

export const jsonParseErrorPositionTransformer = ({
  text,
  offset,
}: {
  text: string;
  offset: number;
}): SourcePosition => {
  const upTo = text.slice(0, offset);
  const line = (upTo.match(/\n/gu)?.length ?? 0) + 1;
  const lastNewline = upTo.lastIndexOf('\n');
  const column = offset - lastNewline;

  return sourcePositionContract.parse({ line, column });
};
