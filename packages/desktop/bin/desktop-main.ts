/**
 * PURPOSE: Electron main-process entry — resolves the target repo from argv and boots the
 *   Electron main process. Thin bootstrap; the boot logic lives in the electron/desktop-boot
 *   adapter + the desktop-main flow/responder.
 *
 * USAGE:
 * electron dist/bin/desktop-main.js --repo /path/to/repo
 */
import { repoFlagTransformer } from '../src/transformers/repo-flag/repo-flag-transformer';
import { StartDesktopMain } from '../src/startup/start-desktop-main';

StartDesktopMain({ repoPath: repoFlagTransformer({ argv: process.argv }) }).catch(
  (error: unknown) => {
    process.stderr.write(`[assayer-desktop] boot failed: ${String(error)}\n`);
  },
);
