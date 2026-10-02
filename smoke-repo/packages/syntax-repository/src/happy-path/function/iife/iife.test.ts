import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'iife.ts'), 'utf8');
const relPath = 'src/happy-path/function/iife/iife.ts';

// The arrow's scope segment is its full STRUCTURAL projection (an anonymous function has no name), so
// the exit ids are long. Held in consts and composed, exactly as the coverage-id ruling intends — an
// id moves only when the logic moves, never for its spelling.
const ARROW =
  'fn:ArrowFunction,StringKeyword,EqualsGreaterThanToken,Block,VariableStatement,VariableDeclarationList,VariableDeclaration,id:size,CallExpression,id:Number,PropertyAccessExpression,PropertyAccessExpression,id:process,id:env,id:SIZE,IfStatement,BinaryExpression,id:size,GreaterThanToken,num:5,Block,ReturnStatement,str:big,ReturnStatement,str:small';
const IF = 'BinaryExpression,id:size,GreaterThanToken,num:5';
const THEN = `*module*/${ARROW}/return@if:${IF}#then`;
const ELSE = `*module*/${ARROW}/return@if:${IF}#else`;

describe('function / iife — an immediately-invoked function expression driven at module load', () => {
  // THE payoff: an IIFE runs when the module is imported, so it is DRIVEN as module-load code. Its body
  // reads `Number(process.env.SIZE)`, so the environment is its input and each arm is a case that sets
  // SIZE and imports the module fresh — exactly like the module-scope env branch, one scope deeper. The
  // entry's ACCESS is `module` (the surface renders it by the file's label, never the arrow's name); its
  // cases set the env var the inverse of the source's own coercion (P4), never a recorded output.
  it('VALID: {(() => { const n = Number(process.env.SIZE); if (n > 5) … })()} => a module-driven entry with one case per arm', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'iife.ts') }), relPath });

    expect(analysis.functions.map((fn) => ({ access: fn.entry.access, cases: fn.cases }))).toStrictEqual([
      {
        access: { kind: 'module' },
        cases: [
          { reachesPath: [THEN], arrange: [{ kind: 'env', name: 'SIZE', value: '6' }], salient: true },
          { reachesPath: [ELSE], arrange: [{ kind: 'env', name: 'SIZE', value: '5' }], salient: true },
        ],
      },
    ]);
  });

  // A file whose IIFE Assayer drives owes NO admission — or the run would both drive it and say it
  // cannot. The sad twin `sad-path/unreachable/iife` holds the other side: its arrow is invoked with a
  // welded literal, so one arm is a case and the other an unreachable-exit lint.
  it('VALID: {a driven IIFE} => admits nothing', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'iife.ts') }), relPath });

    expect({ undriven: analysis.undriven, darkSpots: analysis.darkSpots, lints: analysis.lints }).toStrictEqual({
      undriven: [],
      darkSpots: [],
      lints: [],
    });
  });
});
