import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('number-cond-nullish-number-value-external', () => {
    it('VALID: {value: external} => ternary then on line 27 never run; ternary then on line 27 never run; ternary else on line 27 driven; ternary else on line 27 never run, undriven from line 27, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/async-function/undriven/number-cond-nullish-number-value-external/number-cond-nullish-number-value-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', arm: 'then', line: 27, driven: 'never' }, { kind: 'ternary', arm: 'then', line: 27, driven: 'never' }, { kind: 'ternary', arm: 'else', line: 27, driven: 'driven' }, { kind: 'ternary', arm: 'else', line: 27, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 27 }, { startLine: 27 }],
            darkSpots: [],
            gaps: []
        });
    });
});
