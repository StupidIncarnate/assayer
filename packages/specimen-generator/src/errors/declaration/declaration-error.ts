/**
 * PURPOSE: Raised when a declaration file (a container, syntax or shim) is wrong. The message names
 * the file and what is wrong, so the author can fix it without reading the loader.
 *
 * USAGE:
 * throw new DeclarationError({ file: 'syntax/gt.syntax.ts', message: 'exports no const named gtSyntax' });
 * // Throws with the message 'syntax/gt.syntax.ts: exports no const named gtSyntax'
 */
export class DeclarationError extends Error {
  public readonly file: string;

  public constructor({ file, message }: { file: string; message: string }) {
    super(`${file}: ${message}`);
    this.file = file;
    this.name = 'DeclarationError';
  }
}
