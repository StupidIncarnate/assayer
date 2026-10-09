import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'pure-statement.ts'), 'utf8');
const relPath = 'src/happy-path/switch/pure-statement/pure-statement.ts';

const CASE_1_EXIT = '*module*/exit@switch:id:code,EqualsEqualsEqualsToken,num:1#then';
const CASE_2_EXIT = '*module*/exit@switch:id:code,EqualsEqualsEqualsToken,num:2#then';
const DEFAULT_EXIT =
  '*module*/exit@switch:id:code,EqualsEqualsEqualsToken,num:1#else/switch:id:code,EqualsEqualsEqualsToken,num:2#else';

describe('switch / pure-statement — a bare top-level switch DRIVEN by the environment', () => {
  // The module scope runs at import time and reads `code` from `Number(process.env.CODE)`, so the
  // environment is its input: each case writes CODE and imports the module fresh. This is the same
  // rung as happy-path/if-else/pure-statement/pure-statement.ts one construct over — a switch reads its discriminant's env
  // source exactly as an `if` reads its operand's, so a case can choose an arm.
  it('VALID: {a module-scope switch on Number(process.env.CODE)} => one case per arm, each writing CODE', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'pure-statement.ts') }) });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([
      { reachesPath: [CASE_1_EXIT], arrange: [{ kind: 'env', name: 'CODE', value: '1' }], salient: true },
      { reachesPath: [CASE_2_EXIT], arrange: [{ kind: 'env', name: 'CODE', value: '2' }], salient: true },
      // The default is reached when CODE is neither 1 nor 2 — including unset, which is `Number(undefined)`
      // = NaN, matching no case. So it needs no binding of its own.
      { reachesPath: [DEFAULT_EXIT], arrange: [], salient: true },
    ]);
  });

  // The whole point of the env rung: NO admission. Driving CODE picks the arm, so this is not undriven
  // — the exact complement of sad-path/undriven/opaque-module/opaque-module.ts, which switches (in spirit) on an
  // opaque value the analyzer can neither set nor evaluate and therefore cannot be driven at all.
  it('VALID: {an env-driven switch} => admits nothing as undriven or dark', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'pure-statement.ts') }) });

    expect({ undriven: analysis.undriven, darkSpots: analysis.darkSpots }).toStrictEqual({ undriven: [], darkSpots: [] });
  });
});
