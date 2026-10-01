import * as ourModule from './git';

describe('#gateway/bin/git', () => {
  it('VALID: {module} => exports every git function, gitRun and the not-installed error class', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual([
      'GitNotInstalledError',
      'branchList',
      'catFileBlob',
      'currentBranch',
      'gitRun',
      'headSha',
      'isInsideWorkTree',
      'lsTree',
      'resolveRef',
      'verifyRef',
    ]);
  });
});
