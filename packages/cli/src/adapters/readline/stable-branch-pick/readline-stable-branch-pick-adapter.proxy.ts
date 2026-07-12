import { createInterface } from 'readline';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { CliOutputStub } from '../../../contracts/cli-output/cli-output.stub';

type CliOutput = ReturnType<typeof CliOutputStub>;

export const readlineStableBranchPickAdapterProxy = (): {
  answersWith: (params: { input: string }) => void;
  answersEmpty: () => void;
  getPrompt: () => CliOutput;
} => {
  const answerState = { value: '' };

  const handle = registerMock({ fn: createInterface });

  handle.mockReturnValue({
    question: (_query: string, callback: (answer: string) => void): void => { callback(answerState.value); },
    close: (): void => undefined,
  });

  const stdoutSpy = registerSpyOn({ object: process.stdout, method: 'write' });

  return {
    answersWith: ({ input }: { input: string }): void => {
      answerState.value = input;
    },
    answersEmpty: (): void => {
      answerState.value = '';
    },
    getPrompt: (): CliOutput =>
      CliOutputStub({ value: stdoutSpy.mock.calls.map((call) => String(call[0])).join('') }),
  };
};
