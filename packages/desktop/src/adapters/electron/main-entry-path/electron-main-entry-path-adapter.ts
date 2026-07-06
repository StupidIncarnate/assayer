/**
 * PURPOSE: Resolves the filesystem path to the compiled Electron main entry (dist/bin), relative
 *   to this adapter's location, so the launcher can hand it to the Electron binary.
 *
 * USAGE:
 * electronMainEntryPathAdapter();
 * // Returns the ExecutablePath to dist/bin/desktop-main.js
 */
import { join } from 'node:path';

import { executablePathContract } from '../../../contracts/executable-path/executable-path-contract';
import type { ExecutablePath } from '../../../contracts/executable-path/executable-path-contract';

export const electronMainEntryPathAdapter = (): ExecutablePath =>
  executablePathContract.parse(join(__dirname, '..', '..', '..', '..', 'bin', 'desktop-main.js'));
