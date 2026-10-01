/**
 * PURPOSE: Pass-through for the npm package '@mantine/hooks'. Code outside the gateway imports @mantine/hooks
 * through here instead of the raw package, so a future guard or override on @mantine/hooks lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/mantine__hooks';
 */

export * from '@mantine/hooks';
