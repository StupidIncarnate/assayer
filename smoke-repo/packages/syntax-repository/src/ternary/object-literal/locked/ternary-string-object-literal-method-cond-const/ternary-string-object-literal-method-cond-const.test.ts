import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('ternary-string-object-literal-method-cond-const', () => {
    it('VALID: {cond: const} => ternary on line 5 locked one way, unreachable-exit on line 5, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/object-literal/locked/ternary-string-object-literal-method-cond-const/ternary-string-object-literal-method-cond-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', line: 5, driven: 'one-way' }],
            caseFailures: [],
            lints: [{ rule: 'unreachable-exit', startLine: 5 }],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
