import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-method-cond-not-string-value-const', () => {
    it('VALID: {value: const} => if then on line 26 never run; if else on line 26 driven, unreachable-exit on line 27, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/class/locked/boolean-method-cond-not-string-value-const/boolean-method-cond-not-string-value-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', arm: 'then', line: 26, driven: 'never' }, { kind: 'if', arm: 'else', line: 26, driven: 'driven' }],
            caseFailures: [],
            lints: [{ rule: 'unreachable-exit', startLine: 27 }],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
