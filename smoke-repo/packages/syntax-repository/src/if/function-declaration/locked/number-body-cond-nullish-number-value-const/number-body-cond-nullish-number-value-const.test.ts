import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('number-body-cond-nullish-number-value-const', () => {
    it('VALID: {value: const} => if then on line 25 driven; if else on line 25 never run, unreachable-exit on line 28, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/function-declaration/locked/number-body-cond-nullish-number-value-const/number-body-cond-nullish-number-value-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', arm: 'then', line: 25, driven: 'driven' }, { kind: 'if', arm: 'else', line: 25, driven: 'never' }],
            caseFailures: [],
            lints: [{ rule: 'unreachable-exit', startLine: 28 }],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
