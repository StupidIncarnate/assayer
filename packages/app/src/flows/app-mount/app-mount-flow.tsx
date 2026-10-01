/**
 * PURPOSE: Orchestrates renderer startup — hands the routed app tree to the mount responder.
 *
 * USAGE:
 * AppMountFlow();
 * // Mounts the app; returns { success: true }
 */

import { AppFlow } from '../app/app-flow';
import { AppMountResponder } from '../../responders/app/mount/app-mount-responder';

export const AppMountFlow = (): void => AppMountResponder({ content: <AppFlow /> });
