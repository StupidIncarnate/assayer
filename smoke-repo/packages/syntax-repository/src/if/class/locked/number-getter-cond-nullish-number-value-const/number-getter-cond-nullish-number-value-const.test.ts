import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('number-getter-cond-nullish-number-value-const', () => {
    it('VALID: {value: const} => if then on line 26 driven; if else on line 26 never run, unreachable-exit on line 29, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/class/locked/number-getter-cond-nullish-number-value-const/number-getter-cond-nullish-number-value-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', arm: 'then', line: 26, driven: 'driven' }, { kind: 'if', arm: 'else', line: 26, driven: 'never' }],
            caseFailures: [],
            lints: [{ rule: 'unreachable-exit', startLine: 29 }],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
