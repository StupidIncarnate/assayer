import { zodIssueListContract } from './zod-issue-list-contract';
import { ZodIssueListStub } from './zod-issue-list.stub';

describe('zodIssueListContract', () => {
  describe('valid issue lists', () => {
    it('VALID: {issues: [{path: ["repoRoot"], message}]} => parses successfully', () => {
      const issueList = ZodIssueListStub();

      const result = zodIssueListContract.parse(issueList);

      expect(result).toStrictEqual({
        issues: [{ path: ['repoRoot'], message: 'Expected string, received number' }],
      });
    });

    it('VALID: {issues: [{path: ["exclude", 0], message}]} => parses a numeric path segment', () => {
      const issueList = ZodIssueListStub({
        issues: [{ path: ['exclude', 0], message: 'Expected string, received number' }],
      });

      const result = zodIssueListContract.parse(issueList);

      expect(result).toStrictEqual({
        issues: [{ path: ['exclude', 0], message: 'Expected string, received number' }],
      });
    });

    it('VALID: {issues: []} => parses an empty issue list', () => {
      const issueList = ZodIssueListStub({ issues: [] });

      const result = zodIssueListContract.parse(issueList);

      expect(result).toStrictEqual({ issues: [] });
    });
  });

  describe('invalid issue lists', () => {
    it('INVALID: {issues: "not-an-array"} => throws validation error', () => {
      expect(() => {
        return zodIssueListContract.parse({ issues: 'not-an-array' });
      }).toThrow(/Expected array, received string/u);
    });

    it('INVALID: {issues: [{path: [true], message}]} => throws on a non-string/number path segment', () => {
      expect(() => {
        return zodIssueListContract.parse({
          issues: [{ path: [true], message: 'bad' }],
        });
      }).toThrow(/Invalid input/u);
    });

    it('INVALID: {issues: [{path: [], message: 123}]} => throws when message is not a string', () => {
      expect(() => {
        return zodIssueListContract.parse({
          issues: [{ path: [], message: 123 }],
        });
      }).toThrow(/Expected string, received number/u);
    });
  });
});
