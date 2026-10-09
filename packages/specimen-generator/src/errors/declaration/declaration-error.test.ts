import { DeclarationError } from './declaration-error';

describe('DeclarationError', () => {
  describe('with file and message', () => {
    it('VALID: {file, message} => creates error naming the file and the problem', () => {
      const error = new DeclarationError({
        file: 'syntax/gt.syntax.ts',
        message: 'exports no const named gtSyntax',
      });

      expect({ message: error.message, name: error.name, file: error.file }).toStrictEqual({
        message: 'syntax/gt.syntax.ts: exports no const named gtSyntax',
        name: 'DeclarationError',
        file: 'syntax/gt.syntax.ts',
      });
    });

    it('VALID: {file, message} => message reads file then problem', () => {
      const error = new DeclarationError({ file: 'a.syntax.ts', message: 'bad hole' });

      expect(error.message).toBe('a.syntax.ts: bad hole');
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof DeclarationError => returns true', () => {
      const error = new DeclarationError({ file: 'a.syntax.ts', message: 'bad' });

      expect(error instanceof DeclarationError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new DeclarationError({ file: 'a.syntax.ts', message: 'bad' });

      expect(error instanceof Error).toBe(true);
    });
  });
});
