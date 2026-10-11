/**
 * PURPOSE: Sets one environment variable on the running process. Keeps `getEnv`'s positional
 * shape. The value is a string because the environment only holds strings.
 *
 * USAGE:
 * setEnv('LOCKDOWN_KIT_HOME', '/tmp/dm-test');
 * // Sets process.env.LOCKDOWN_KIT_HOME; every child spawned afterwards inherits it
 */

export const setEnv = (name: string, value: string): void => {
  process.env[name] = value;
};
