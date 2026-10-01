import { questionProxy } from '#gateway/node/readline/question/question.proxy';
import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';
import { getStdinProxy } from '#gateway/node/process/get-stdin/get-stdin.proxy';

export const stableBranchPickBrokerProxy = (): {
  answersWith: (params: { prompt: string; input: string }) => void;
  answersEmpty: (params: { prompt: string }) => void;
  getPromptsAsked: () => readonly string[];
} => {
  const stdinGateway = getStdinProxy();
  stdoutProxy();
  const questionGateway = questionProxy();

  return {
    answersWith: ({ prompt, input }: { prompt: string; input: string }): void => {
      stdinGateway.setupStream();
      questionGateway.answers({ prompt, answer: input });
    },
    answersEmpty: ({ prompt }: { prompt: string }): void => {
      stdinGateway.setupStream();
      questionGateway.answers({ prompt, answer: '' });
    },
    getPromptsAsked: (): readonly string[] => questionGateway.getPromptsAsked(),
  };
};
