import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-statement-cond-not-boolean-value-const', () => {
    it('VALID: {value: const} => if then on line 24 never run; if else on line 24 driven, unreachable-exit on line 25, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/module/locked/boolean-statement-cond-not-boolean-value-const/boolean-statement-cond-not-boolean-value-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', arm: 'then', line: 24, driven: 'never' }, { kind: 'if', arm: 'else', line: 24, driven: 'driven' }],
            caseFailures: [],
            lints: [{ rule: 'unreachable-exit', startLine: 25 }],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
