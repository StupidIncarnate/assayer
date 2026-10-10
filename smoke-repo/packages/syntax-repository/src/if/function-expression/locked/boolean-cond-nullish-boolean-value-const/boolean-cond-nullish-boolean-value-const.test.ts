import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-cond-nullish-boolean-value-const', () => {
    it('VALID: {value: const} => if then on line 25 driven; if else on line 25 never run, unreachable-exit on line 28, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/function-expression/locked/boolean-cond-nullish-boolean-value-const/boolean-cond-nullish-boolean-value-const.ts'
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
