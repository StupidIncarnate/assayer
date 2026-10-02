/**
 * PURPOSE: Gateway entry for the npm package 'tsx'. tsx is a command-line tool, not a library a
 * caller imports, so nothing passes through. What a caller needs from it is where its loader lives,
 * so it can run `node --import <loader> <script>` without `npx`.
 *
 * USAGE:
 * import { tsxLoaderUrl } from '#gateway/npm/tsx';
 */

export { tsxLoaderUrl } from './tsx-loader-url/tsx-loader-url';
