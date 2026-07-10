/**
 * PURPOSE: Converts a glob pattern into an anchored RegExp for matching relative file paths.
 *   '**' matches across path separators (including '/'), a single '*' matches only within one
 *   path segment (never crossing '/'), and '?' matches exactly one non-separator character. All
 *   other regex metacharacters found in the glob are escaped so they match literally.
 *
 * USAGE:
 * globToRegexTransformer({ glob: 'dist/*' });
 * // Returns /^dist\/[^/]*$/u -- matches 'dist/index.js', not 'dist/nested/index.js'
 *
 * globToRegexTransformer({ glob: '**' + '/generated/' + '**' });
 * // Returns /^.*\/generated\/.*$/u -- matches any path containing a 'generated' segment
 */

// Sentinel tokens built from ASCII control characters (\x01-\x03). These cannot appear in a real
// glob string, they contain no regex metacharacters (so the escaping pass leaves them untouched),
// and they are swapped for their regex translation afterward. This ordering keeps the escaping
// step and the wildcard-ordering step ('**' before '*') from colliding with each other.
const DOUBLE_STAR_TOKEN = '\x01';
const SINGLE_STAR_TOKEN = '\x02';
const QUESTION_MARK_TOKEN = '\x03';

const REGEX_METACHARACTER_PATTERN = /[.+^${}()|[\]\\]/gu;

export const globToRegexTransformer = ({ glob }: { glob: string }): RegExp => {
  const tokenized = glob
    .replace(/\*\*/gu, DOUBLE_STAR_TOKEN)
    .replace(/\*/gu, SINGLE_STAR_TOKEN)
    .replace(/\?/gu, QUESTION_MARK_TOKEN);

  const escaped = tokenized.replace(REGEX_METACHARACTER_PATTERN, '\\$&');

  const translated = escaped
    .split(DOUBLE_STAR_TOKEN)
    .join('.*')
    .split(SINGLE_STAR_TOKEN)
    .join('[^/]*')
    .split(QUESTION_MARK_TOKEN)
    .join('[^/]');

  return new RegExp(`^${translated}$`, 'u');
};
