/**
 * PURPOSE: Wraps @testing-library/react renderHook so binding tests can render hooks without a
 *   direct testing-library import (bindings' allowed-import list excludes it).
 *
 * USAGE:
 * const { result } = testingLibraryRenderHookAdapter({ renderCallback: () => useMyBinding() });
 * // Returns the RenderHookResult from @testing-library/react
 */
import type { RenderHookResult } from '#gateway/npm/testing-library__react';
import { renderHook } from '#gateway/npm/testing-library__react';

export const testingLibraryRenderHookAdapter = <TResult>({
  renderCallback,
}: {
  renderCallback: () => TResult;
}): RenderHookResult<TResult, undefined> => renderHook(renderCallback);
