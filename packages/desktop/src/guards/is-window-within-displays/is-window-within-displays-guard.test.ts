import { DisplayStub } from '#gateway/npm/electron/display/display.stub';

import { isWindowWithinDisplaysGuard } from './is-window-within-displays-guard';

describe('isWindowWithinDisplaysGuard', () => {
  const primaryDisplay = DisplayStub({
    id: 1,
    bounds: { x: 0, y: 0, width: 1920, height: 1080 },
  });

  const secondaryDisplay = DisplayStub({
    id: 2,
    bounds: { x: 1920, y: 0, width: 2560, height: 1440 },
  });

  describe('valid coordinates inside display bounds', () => {
    it('VALID: {x, y inside primary display} => returns true', () => {
      const result = isWindowWithinDisplaysGuard({
        x: 100,
        y: 100,
        displays: [primaryDisplay],
      });

      expect(result).toBe(true);
    });

    it('VALID: {x, y inside secondary display} => returns true', () => {
      const result = isWindowWithinDisplaysGuard({
        x: 2000,
        y: 500,
        displays: [primaryDisplay, secondaryDisplay],
      });

      expect(result).toBe(true);
    });

    it('VALID: {x, y at display origin} => returns true', () => {
      const result = isWindowWithinDisplaysGuard({
        x: 0,
        y: 0,
        displays: [primaryDisplay],
      });

      expect(result).toBe(true);
    });
  });

  describe('invalid coordinates or displays', () => {
    it('INVALID: {x, y outside all displays} => returns false', () => {
      const result = isWindowWithinDisplaysGuard({
        x: 5000,
        y: 5000,
        displays: [primaryDisplay],
      });

      expect(result).toBe(false);
    });

    it('EMPTY: {missing x} => returns false', () => {
      const result = isWindowWithinDisplaysGuard({
        y: 100,
        displays: [primaryDisplay],
      });

      expect(result).toBe(false);
    });

    it('EMPTY: {missing y} => returns false', () => {
      const result = isWindowWithinDisplaysGuard({
        x: 100,
        displays: [primaryDisplay],
      });

      expect(result).toBe(false);
    });

    it('EMPTY: {empty displays array} => returns false', () => {
      const result = isWindowWithinDisplaysGuard({
        x: 100,
        y: 100,
        displays: [],
      });

      expect(result).toBe(false);
    });

    it('EMPTY: {displays undefined} => returns false', () => {
      const result = isWindowWithinDisplaysGuard({
        x: 100,
        y: 100,
      });

      expect(result).toBe(false);
    });
  });
});
