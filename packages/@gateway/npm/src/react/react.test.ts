import * as ourModule from './react';
// A raw `require`, not `import * as`: TS's importStar helper synthesizes a .default onto any
// CJS module that lacks __esModule, which is every third-party package here — comparing
// against that synthetic shape would fail every pass-through. `import x = require(...)` compiles
// straight to `require(...)`, so pkgModule is the package's own real runtime shape.
import pkgModule = require('react');

describe('#gateway/npm/react', () => {
  it('VALID: {module} => default is react itself and each named value is its own binding', () => {
    expect({ ...ourModule }).toStrictEqual({
      ...Object.fromEntries(Object.entries(pkgModule).filter(([name]) => name in ourModule)),
      default: pkgModule,
    });
  });
});
