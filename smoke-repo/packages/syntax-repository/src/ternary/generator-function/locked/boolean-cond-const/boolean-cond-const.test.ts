import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-cond-const', () => {
    it('VALID: {cond: const} => ternary then on line 25 driven; ternary else on line 25 never run, unreachable-exit on line 25, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/generator-function/locked/boolean-cond-const/boolean-cond-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', arm: 'then', line: 25, driven: 'driven' }, { kind: 'ternary', arm: 'else', line: 25, driven: 'never' }],
            caseFailures: [],
            lints: [{ rule: 'unreachable-exit', startLine: 25 }],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
