/**
 * PURPOSE: The names the analyzer recognizes when it reads a value from the process environment:
 *   `process.env.<NAME>`, plus the steps it can run backwards from a branch operand to the string the
 *   environment holds: the `Number(x)` coercion, and the `x.split(s)` and `xs.map(f)` methods.
 *
 *   These are NAMES of runtime globals and standard methods, not a naming convention: `process` and
 *   `Number` mean one thing each in a JavaScript program, and `read-env-access` (for `process`) and
 *   `read-env-chain` (for `Number`) prove that meaning rather than assuming it. It asks the checker whether anything in the file declares them, and
 *   declines when something does. A file that shadows either is opting out of this rule, not evading it.
 *
 *   Each name here has an inverse in `env-encode`. `Number` inverts through `String`, `split` through
 *   joining items with the same separator, and `map` keeps the array's length. Adding a name here
 *   without its inverse in `env-encode` would derive cases that cannot drive what they claim.
 *
 *   `fillers` are the one-character items `env-encode` joins to build a split list of a wanted length.
 *   It takes the first one the separator does not contain, so joining adds no extra separator. Three
 *   are enough for any separator that is not made of all three.
 *
 *   `argv` names the command-line read, `process.argv[<index>]` or `process.argv.slice(<index>)`. No
 *   case can set argv, so these names need no inverse. `runnerLength` is how many entries argv holds
 *   in the worker that runs a case: the Node binary and the worker's entry file. `forkWorker` starts
 *   that worker with no arguments of its own, so every entry from this index on is absent.
 *
 * USAGE:
 * envSourceStatics.global;
 * // Returns 'process'
 */
export const envSourceStatics = {
  global: 'process',
  property: 'env',
  coercion: 'Number',
  methods: {
    split: 'split',
    map: 'map',
  },
  fillers: ['a', 'b', 'c'],
  argv: {
    property: 'argv',
    slice: 'slice',
    runnerLength: 2,
  },
} as const;
