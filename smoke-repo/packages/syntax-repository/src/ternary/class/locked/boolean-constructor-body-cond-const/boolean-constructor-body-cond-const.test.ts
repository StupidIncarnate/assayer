import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-constructor-body-cond-const', () => {
    it('VALID: {cond: const} => ternary then on line 26 driven; ternary else on line 26 never run, unreachable-exit on line 26, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/class/locked/boolean-constructor-body-cond-const/boolean-constructor-body-cond-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', arm: 'then', line: 26, driven: 'driven' }, { kind: 'ternary', arm: 'else', line: 26, driven: 'never' }],
            caseFailures: [],
            lints: [{ rule: 'unreachable-exit', startLine: 26 }],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
