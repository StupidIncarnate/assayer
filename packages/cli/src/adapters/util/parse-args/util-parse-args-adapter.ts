/**
 * PURPOSE: Parses a subcommand's argv into positionals using Node's built-in `util.parseArgs` — the
 *   CLI's real argument parser.
 *
 *   Built-in rather than a parser library because no third-party dependency can be added to this
 *   repo at all: `@dungeonmaster/*` are file: links to a sibling checkout, so any install
 *   re-resolves the tree. `parseArgs` covers what the closed verb set needs and costs nothing.
 *
 *   `strict: true` is the point. An unknown flag is REFUSED rather than silently ignored: a CLI that
 *   swallows `--only-failures` runs everything and reports success, which is worse than not having
 *   the flag at all — the caller believes something happened that did not. There are deliberately no
 *   options to declare; per-invocation tuning knobs are what config is for.
 *
 * USAGE:
 * utilParseArgsAdapter({ argv: ['src/a.ts', 'src/b.ts'] });
 * // Returns the positionals — or throws on an unrecognized flag
 */
import { parseArgs } from 'node:util';

import { cliPositionalContract } from '../../../contracts/cli-positional/cli-positional-contract';
import type { CliPositional } from '../../../contracts/cli-positional/cli-positional-contract';

export const utilParseArgsAdapter = ({ argv }: { argv: readonly string[] }): CliPositional[] => {
  const { positionals } = parseArgs({ args: [...argv], strict: true, allowPositionals: true });

  return positionals.map((positional) => cliPositionalContract.parse(positional));
};
