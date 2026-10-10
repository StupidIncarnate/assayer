import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('number-field-cond-nullish-number-value-external', () => {
    it('VALID: {value: external} => ternary then on line 26 never run; ternary then on line 26 never run; ternary else on line 26 never run; ternary else on line 26 never run, undriven from line 26, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/class/undriven/number-field-cond-nullish-number-value-external/number-field-cond-nullish-number-value-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', arm: 'then', line: 26, driven: 'never' }, { kind: 'ternary', arm: 'then', line: 26, driven: 'never' }, { kind: 'ternary', arm: 'else', line: 26, driven: 'never' }, { kind: 'ternary', arm: 'else', line: 26, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 26 }, { startLine: 26 }],
            darkSpots: [],
            gaps: []
        });
    });
});
