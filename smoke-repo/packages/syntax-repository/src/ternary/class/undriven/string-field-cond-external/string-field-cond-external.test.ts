import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('string-field-cond-external', () => {
    it('VALID: {cond: external} => ternary then on line 23 never run; ternary else on line 23 never run, undriven from line 23, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/class/undriven/string-field-cond-external/string-field-cond-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', arm: 'then', line: 23, driven: 'never' }, { kind: 'ternary', arm: 'else', line: 23, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 23 }],
            darkSpots: [],
            gaps: []
        });
    });
});
