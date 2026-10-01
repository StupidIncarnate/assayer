import { deleteEnvProxy } from '#gateway/node/process/delete-env/delete-env.proxy';
import { getEnvProxy } from '#gateway/node/process/get-env/get-env.proxy';
import { setEnvProxy } from '#gateway/node/process/set-env/set-env.proxy';

// The broker writes and restores real environment variables, and its tests read them back, so no
// variable is staged: every env wrapper here runs real.
export const caseInterpretBrokerProxy = (): Record<PropertyKey, never> => {
  deleteEnvProxy();
  getEnvProxy();
  setEnvProxy();

  return {};
};
