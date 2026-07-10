import { gitCatFileBroker } from './git-cat-file-broker';
import { gitCatFileBrokerProxy } from './git-cat-file-broker.proxy';

describe('gitCatFileBroker', () => {
  describe('blob exists', () => {
    it('VALID: {repoRoot: "/repo", blobSha: a committed blob} => returns the exact file contents unmodified', async () => {
      const proxy = gitCatFileBrokerProxy();

      proxy.hasBlob({ content: 'export const x = 1;\n' });

      const result = await gitCatFileBroker({
        repoRoot: '/repo',
        blobSha: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      });

      expect(result).toBe('export const x = 1;\n');
    });
  });
});
