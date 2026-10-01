import { ts } from 'ts-morph';

export const SourceFileStub = ({
  code = 'const a = 1;',
  fileName = 'gateway-stub-sample.ts',
}: {
  code?: string;
  fileName?: string;
} = {}): ts.SourceFile => ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true);
