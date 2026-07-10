/**
 * PURPOSE: Represents a CLI failure whose message is asserted verbatim by callers and
 *   tests — the exact text is the product surface (e.g. malformed assayer.config.json).
 *
 * USAGE:
 * throw new CliExactOutputError({message: 'assayer.config.json: invalid JSON at line 3 column 12: Unexpected token }'});
 * // Throws CliExactOutputError with that exact message
 */
export class CliExactOutputError extends Error {
  public constructor({ message }: { message: string }) {
    super(message);
    this.name = 'CliExactOutputError';
  }
}
