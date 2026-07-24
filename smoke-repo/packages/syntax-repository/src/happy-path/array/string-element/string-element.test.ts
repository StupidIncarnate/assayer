import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'string-element.ts'), 'utf8');
const relPath = 'src/happy-path/array/string-element/string-element.ts';

// The callback `(tag) => { … }` is anonymous, so its scope segment is the spelling-invariant STRUCTURAL
// projection of the arrow (node kinds + leaf values) — the identity two different anonymous arrows differ
// by. The condition leaves are STRING literals (`str:urgent`) and the length guard reads the `.length`
// member, so this id carries `str:` and `PropertyAccessExpression` leaves rather than the numeric ones —
// which is the whole point: the funnel reads each operand's TYPE, so the single element values are
// STRINGS, not numbers. Coverage IDs are cache-internal, so the exact shape is not load-bearing; what it
// pins is that the callback's exits attach UNDER labelTags's scope path, so the funnel threads through
// `*module*/labelTags/<CB>/…` before returning by labelTags's own exit.
const CB =
  'fn:ArrowFunction,Parameter,id:tag,EqualsGreaterThanToken,Block,IfStatement,BinaryExpression,id:tag,' +
  'EqualsEqualsEqualsToken,str:urgent,Block,ReturnStatement,str:P1,IfStatement,BinaryExpression,' +
  'PropertyAccessExpression,id:tag,id:length,GreaterThanToken,num:8,Block,ReturnStatement,str:verbose,' +
  'ReturnStatement,str:normal';
const CB_PATH = `*module*/labelTags/${CB}`;
const URGENT = 'if:BinaryExpression,id:tag,EqualsEqualsEqualsToken,str:urgent';
const LEN8 = 'if:BinaryExpression,PropertyAccessExpression,id:tag,id:length,GreaterThanToken,num:8';

// The three callback exits — one per arm of `tag === 'urgent'` / `tag.length > 8` — and labelTags's own
// single return.
const CB_THEN = `${CB_PATH}/return@${URGENT}#then`;
const CB_ELSE_THEN = `${CB_PATH}/return@${URGENT}#else/${LEN8}#then`;
const CB_ELSE_ELSE = `${CB_PATH}/return@${URGENT}#else/${LEN8}#else`;
const LABELTAGS_EXIT = '*module*/labelTags/return@top';

describe('array / string-element — `tags.map((tag) => …)` whose callback BRANCHES on STRING operands, funnelled into labelTags', () => {
  // The STRING twin of map-conditional. The callback is not called directly — nothing can call an
  // anonymous arrow, and it cannot be reached without calling `labelTags`. So it is no separate entry:
  // its steering values FUNNEL into labelTags's OWN case set. labelTags is the only entry, and each case
  // is an array shape that drives the callback, predicting the ordered PATH the flow reaches — the
  // callback's exit(s), then labelTags's return. The funnelled single element values are STRINGS derived
  // from the operand TYPE, never a hardcoded number: `['urgent']` takes the `tag === 'urgent'` arm, a
  // >8-char string (`['abc123abc']`) takes the `tag.length > 8` arm, and `['']` falls through. `[]` runs
  // the callback zero times (path is labelTags's exit alone); `['urgent', 'abc123abc']` crosses two arms
  // in one array, firing the callback once per element. Each value is an INPUT (P4); the case asserts only
  // the reached PATH.
  it('VALID: {a map callback branching on STRING operands} => FUNNELLED into labelTags, array shapes of strings driving each arm', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(
      analysis.functions.map((fn) => ({ name: fn.entry.name, label: fn.entry.label, access: fn.entry.access, cases: fn.cases })),
    ).toStrictEqual([
      {
        name: 'labelTags',
        label: undefined,
        access: { kind: 'named' },
        cases: [
          { reachesPath: [LABELTAGS_EXIT], arrange: [{ kind: 'array', param: 'tags', value: [] }], salient: true },
          { reachesPath: [CB_THEN, LABELTAGS_EXIT], arrange: [{ kind: 'array', param: 'tags', value: ['urgent'] }], salient: true },
          {
            reachesPath: [CB_ELSE_THEN, LABELTAGS_EXIT],
            arrange: [{ kind: 'array', param: 'tags', value: ['abc123abc'] }],
            salient: true,
          },
          { reachesPath: [CB_ELSE_ELSE, LABELTAGS_EXIT], arrange: [{ kind: 'array', param: 'tags', value: [''] }], salient: true },
          {
            reachesPath: [CB_THEN, CB_ELSE_THEN, LABELTAGS_EXIT],
            arrange: [{ kind: 'array', param: 'tags', value: ['urgent', 'abc123abc'] }],
            salient: true,
          },
        ],
      },
    ]);
  });

  // The callback is reached, so it is not dead code, and every arm drives through labelTags's funnel.
  // Nothing is admitted — the walk read each string arm and each is a driven case.
  it('VALID: {a reached, funnelled string callback} => no dead-surface lint, nothing undriven or dark', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect({
      lints: analysis.lints,
      undriven: analysis.undriven,
      darkSpots: analysis.darkSpots,
      declaredTypes: analysis.declaredTypes,
    }).toStrictEqual({ lints: [], undriven: [], darkSpots: [], declaredTypes: [] });
  });
});
