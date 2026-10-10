import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-getter-cond-const', () => {
    it('VALID: {cond: const} => if then on line 26 driven; if else on line 26 never run, unreachable-exit on line 29, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/class/locked/boolean-getter-cond-const/boolean-getter-cond-const.ts'
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
