/**
 * PURPOSE: Electron preload entry — exposes the assayer bridge. Thin bootstrap; the contextBridge
 *   logic lives in the electron/preload-bridge adapter + the desktop-preload flow/responder.
 *
 * USAGE:
 * // Referenced by the BrowserWindow webPreferences.preload
 */
import { StartDesktopPreload } from '../src/startup/start-desktop-preload';

StartDesktopPreload();
