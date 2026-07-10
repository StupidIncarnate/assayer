/**
 * PURPOSE: Reports whether the CLI's stdout is attached to an interactive terminal (TTY).
 *
 * USAGE:
 * processStdoutIsTtyAdapter();
 * // Returns true when stdout is a TTY, false otherwise
 */
export const processStdoutIsTtyAdapter = (): boolean => process.stdout.isTTY;
