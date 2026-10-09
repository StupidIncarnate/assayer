import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('ternary-number-object-literal-property-cond-nullish-number-value-const', () => {
    it('VALID: {value: const} => ternary on line 4 locked one way, unreachable-exit on line 4, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/object-literal/ternary-number-object-literal-property-cond-nullish-number-value-const/ternary-number-object-literal-property-cond-nullish-number-value-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', line: 4, driven: 'one-way' }],
            caseFailures: [],
            lints: [{ rule: 'unreachable-exit', startLine: 4 }],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
