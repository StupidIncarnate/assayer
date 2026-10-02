/**
 * PURPOSE: Resolves the `file:` URL of tsx's loader entry, the value `node --import <url>` takes to
 * run a TypeScript file in one process. Reach for it over tsx's own CLI: the CLI launches a second
 * process that does not inherit node flags given before it, such as `--conditions=source`.
 * Resolved from this package's own location, so it finds the copy this gateway declares.
 *
 * USAGE:
 * const loader = tsxLoaderUrl();
 * // Returns a URL such as file:///repo/node_modules/tsx/dist/loader.mjs; throws when tsx is not installed
 * // spawn: node --conditions=source --import <loader> script.ts
 */
import { pathToFileURL } from 'url';

export const tsxLoaderUrl = (): string => pathToFileURL(require.resolve('tsx')).href;
