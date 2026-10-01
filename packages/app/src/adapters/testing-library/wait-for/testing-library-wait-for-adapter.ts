/**
 * PURPOSE: Wraps @testing-library/react waitFor so binding tests can await async state without a
 *   direct testing-library import.
 *
 * USAGE:
 * await testingLibraryWaitForAdapter({ callback: () => { expect(state().loading).toBe(false); } });
 * // Resolves once the callback stops throwing
 */
import { waitFor } from '#gateway/npm/testing-library__react';

export const testingLibraryWaitForAdapter = async ({
  callback,
}: {
  callback: () => void;
}): Promise<void> => {
  await waitFor(callback);

};
