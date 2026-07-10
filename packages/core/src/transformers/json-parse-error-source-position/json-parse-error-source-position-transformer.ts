/**
 * PURPOSE: Extracts the 1-based source position (line, column) of a JSON.parse SyntaxError from
 *   its message text and the original JSON source. Node embeds the failing character offset as
 *   "position N" in the message; this locates that offset within the source text. Falls back to
 *   offset 0 when the message does not report a position.
 *
 * USAGE:
 * jsonParseErrorSourcePositionTransformer({
 *   message: 'Expected double-quoted property name in JSON at position 16 (line 1 column 17)',
 *   text: '{"version": "1",}',
 * });
 * // Returns { line: 1, column: 17 }
 */
import { jsonParseErrorPositionTransformer } from '../json-parse-error-position/json-parse-error-position-transformer';
import type { SourcePosition } from '../../contracts/source-position/source-position-contract';

export const jsonParseErrorSourcePositionTransformer = ({
  message,
  text,
}: {
  message: string;
  text: string;
}): SourcePosition => {
  const match = /position (\d+)/u.exec(message);
  const offset = Number(match?.[1] ?? 0);

  return jsonParseErrorPositionTransformer({ text, offset });
};
