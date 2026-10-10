import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-cond-gt-string-value-external', () => {
    it('VALID: {value: external} => ternary then on line 23 never run; ternary else on line 23 never run, undriven from line 22, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/iife/undriven/boolean-cond-gt-string-value-external/boolean-cond-gt-string-value-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', arm: 'then', line: 23, driven: 'never' }, { kind: 'ternary', arm: 'else', line: 23, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 22 }],
            darkSpots: [],
            gaps: []
        });
    });
});
