import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';

const source = readFileSync(join(__dirname, 'switch-in-if.ts'), 'utf8');

const IF = '*module*/route/if:id:enabled';
const GET = '*module*/route/switch:id:method,EqualsEqualsEqualsToken,str:get';

describe('composition / switch-in-if — a switch nested inside an if arm', () => {
  // REGRESSION GUARD. The old flat per-kind scans emitted switch exits with a hardcoded
  // single-step guard, so the enclosing `if` was silently LOST and every case looked reachable
  // unconditionally. The walk carries the outer guard into the clause, so both steps are present.
  it('VALID: {switch inside an if} => every switch exit carries the enclosing if guard FIRST', () => {
    const result = analyzeExtractBroker({ source, relPath: 'src/composition/switch-in-if.ts' });
    const guards = result.success
      ? result.functions.flatMap((fn) => fn.exits).map((exit) => exit.guardPath.map((step) => `${step.branchCoverageId}#${step.arm}`))
      : [];

    expect(guards).toStrictEqual([
      [`${IF}#then`, `${GET}#then`],
      [`${IF}#then`, `${GET}#else`],
      [`${IF}#else`],
    ]);
  });
});
