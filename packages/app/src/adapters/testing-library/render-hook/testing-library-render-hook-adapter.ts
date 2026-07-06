/**
 * PURPOSE: Wraps @testing-library/react renderHook so binding tests can render hooks without a
 *   direct testing-library import (bindings' allowed-import list excludes it).
 *
 * USAGE:
 * const { result } = testingLibraryRenderHookAdapter({ renderCallback: () => useMyBinding() });
 * // Returns the RenderHookResult from @testing-library/react
 */
import type { RenderHookResult } from '@testing-library/react';
import { renderHook } from '@testing-library/react';

export const testingLibraryRenderHookAdapter = <TResult>({
  renderCallback,
}: {
  renderCallback: () => TResult;
}): RenderHookResult<TResult, undefined> => renderHook(renderCallback);
