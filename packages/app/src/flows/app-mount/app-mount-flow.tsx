/**
 * PURPOSE: Orchestrates renderer startup — hands the routed app tree to the mount responder.
 *
 * USAGE:
 * AppMountFlow();
 * // Mounts the app; returns { success: true }
 */
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { AppFlow } from '../app/app-flow';
import { AppMountResponder } from '../../responders/app/mount/app-mount-responder';

export const AppMountFlow = (): AdapterResult => AppMountResponder({ content: <AppFlow /> });
