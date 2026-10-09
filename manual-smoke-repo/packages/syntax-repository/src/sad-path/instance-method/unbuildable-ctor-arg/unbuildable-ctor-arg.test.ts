import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'unbuildable-ctor-arg.ts'), 'utf8');
const relPath = 'src/sad-path/instance-method/unbuildable-ctor-arg/unbuildable-ctor-arg.ts';

describe('instance-method / unbuildable-ctor-arg — a constructor argument no value can be built for leaves the instance method with no instance', () => {
  // `Repo`'s constructor takes a callback. Assayer builds inputs only from declared data, so it cannot
  // build that argument, and the constructor derives no case. `find` is an ordinary method with a
  // derivable parameter, so the file's own analysis lists it as an entry. It is the RUN's case-set
  // projection that finds no instance to call it on, and admits it as undriven.
  it('VALID: {a class whose constructor takes a callback} => a constructor entry and a NON-constructable method entry', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'unbuildable-ctor-arg.ts') }) });

    expect(analysis.functions.map((fn) => ({ name: fn.entry.name, access: fn.entry.access, cases: fn.cases.length > 0 }))).toStrictEqual([
      { name: 'constructor', access: { kind: 'constructor', className: 'Repo' }, cases: false },
      { name: 'find', access: { kind: 'method', className: 'Repo', constructable: false }, cases: true },
    ]);
  });

  // The constructor's refusal is the caller's debt, and a harness key under `constructor` pays it. That
  // payment gives the constructor its own test inputs. It does not give `find` an instance, which the
  // run reports on the undriven channel.
  it('VALID: {the callback argument} => one input gap on the constructor, naming the argument and the harness key that pays it', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'unbuildable-ctor-arg.ts') }) });

    expect(analysis.gaps).toStrictEqual([
      {
        name: 'constructor',
        reason:
          '`constructor` derives no case, because Assayer cannot construct an input it needs. It builds inputs out of declared ' +
          'DATA — a scalar, a union, an array, or an object shape whose every property is itself one — and refuses anything that ' +
          'bottoms out in a function or in a type carrying nothing but its name: `report: (message: string) => string`. ' +
          'Substituting a stand-in would be worse than deriving nothing: code that CALLS the value throws on it, and code that ' +
          'merely measures it passes on something nobody supplied. Assayer read the signature perfectly — this is not syntax it ' +
          "missed — so the value is the caller's to supply. Colocate a harness with this file, the same basename with a " +
          "`.harness.ts` extension, and declare the input: `import { assayerHarness } from '@assayer/core'; " +
          'assayerHarness({ inputs: { constructor: { report: <a (message: string) => string> } } });`. Assayer then builds them ' +
          'from that declaration instead of refusing them; anything else still standing between `constructor` and a case is ' +
          'reported on its own line.',
      },
    ]);
  });

  it('VALID: {the unbuildable-ctor-arg specimen} => no dark spots, no undriven in the analysis, no lints', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'unbuildable-ctor-arg.ts') }) });

    expect({ darkSpots: analysis.darkSpots, undriven: analysis.undriven, lints: analysis.lints }).toStrictEqual({
      darkSpots: [],
      undriven: [],
      lints: [],
    });
  });
});
