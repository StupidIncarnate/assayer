import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('number-default-param-cond-nullish-number-value-external', () => {
    it('VALID: {value: external} => ternary then on line 25 never run; ternary then on line 25 never run; ternary else on line 25 never run; ternary else on line 25 never run, undriven from line 25, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/function-declaration/undriven/number-default-param-cond-nullish-number-value-external/number-default-param-cond-nullish-number-value-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', arm: 'then', line: 25, driven: 'never' }, { kind: 'ternary', arm: 'then', line: 25, driven: 'never' }, { kind: 'ternary', arm: 'else', line: 25, driven: 'never' }, { kind: 'ternary', arm: 'else', line: 25, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 25 }, { startLine: 25 }],
            darkSpots: [],
            gaps: []
        });
    });
});
