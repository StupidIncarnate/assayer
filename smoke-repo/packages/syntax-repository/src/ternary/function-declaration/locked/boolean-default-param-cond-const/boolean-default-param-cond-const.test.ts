import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-default-param-cond-const', () => {
    it('VALID: {cond: const} => ternary on line 23 locked one way, unreachable-exit on line 23, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/function-declaration/locked/boolean-default-param-cond-const/boolean-default-param-cond-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', line: 23, driven: 'one-way' }],
            caseFailures: [],
            lints: [{ rule: 'unreachable-exit', startLine: 23 }],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
