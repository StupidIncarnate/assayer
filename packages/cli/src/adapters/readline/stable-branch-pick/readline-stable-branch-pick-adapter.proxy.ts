import { createInterface } from 'readline';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { CliOutputStub } from '../../../contracts/cli-output/cli-output.stub';

type CliOutput = ReturnType<typeof CliOutputStub>;

export const readlineStableBranchPickAdapterProxy = (): {
  answersWith: (params: { input: string }) => void;
  answersEmpty: () => void;
  closesAtEof: () => void;
  getPrompt: () => CliOutput;
  promptWasWritten: () => boolean;
} => {
  const answerState = { value: '', eof: false };
  const closeHandlers: (() => void)[] = [];

  const handle = registerMock({ fn: createInterface });

  handle.mockReturnValue({
    on: (event: string, listener: () => void): void => {
      if (event === 'close') {
        closeHandlers.push(listener);
      }
    },
    question: (_query: string, callback: (answer: string) => void): void => {
      // eof models a non-interactive stdin: readline emits 'close' and NEVER fires the line
      // callback, so drive the registered close handlers instead of answering with a line.
      if (answerState.eof) {
        closeHandlers.forEach((listener) => {
          listener();
        });
        return;
      }
      callback(answerState.value);
    },
    close: (): void => undefined,
  });

  const stdoutSpy = registerSpyOn({ object: process.stdout, method: 'write' });

  return {
    answersWith: ({ input }: { input: string }): void => {
      answerState.value = input;
      answerState.eof = false;
    },
    answersEmpty: (): void => {
      answerState.value = '';
      answerState.eof = false;
    },
    closesAtEof: (): void => {
      answerState.eof = true;
    },
    getPrompt: (): CliOutput =>
      CliOutputStub({ value: stdoutSpy.mock.calls.map((call) => String(call[0])).join('') }),
    promptWasWritten: (): boolean => stdoutSpy.mock.calls.length > 0,
  };
};
