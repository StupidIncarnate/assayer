import * as ourModule from './npm';

describe('#gateway/bin/npm', () => {
  it('VALID: {module} => exports runBuild, npmRun and the not-installed error class', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual([
      'NpmNotInstalledError',
      'npmRun',
      'runBuild',
    ]);
  });
});
