/**
 * PURPOSE: Pass-through for the npm package '@testing-library/react'. Code outside the gateway
 * imports it through here instead of the raw package, so a future guard or override lands in this
 * one file and reaches every caller. `render` carries no override here, so a caller that needs a
 * provider around it wraps this raw `render` itself.
 *
 * USAGE:
 * import { render, renderHook, screen } from '#gateway/npm/testing-library__react';
 */

export * from '@testing-library/react';
