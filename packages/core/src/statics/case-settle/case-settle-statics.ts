/**
 * PURPOSE: The fixed facts `caseSettleBroker` reads when it lets an entry's result finish running.
 *
 *   `generatorTags` are the `Object.prototype.toString` tags of a generator object and an async
 *   generator object. A generator's body runs only while something iterates it, so a result carrying
 *   one of these tags is iterated to its end. The tag is read rather than `instanceof`, because the
 *   code under test may build its generator in another realm.
 *
 *   `limits.generatorSteps` caps how many values one case iterates out of a generator. A generator
 *   that never ends would otherwise hold the case open forever.
 *
 * USAGE:
 * caseSettleStatics.limits.generatorSteps;
 * // 10000
 */
export const caseSettleStatics = {
  generatorTags: ['[object Generator]', '[object AsyncGenerator]'],
  limits: {
    generatorSteps: 10000,
  },
} as const;
