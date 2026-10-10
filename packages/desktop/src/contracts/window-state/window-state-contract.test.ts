import { windowStateContract } from './window-state-contract';
import { WindowStateStub } from './window-state.stub';

describe('windowStateContract', () => {
  describe('valid window state', () => {
    it('VALID: {width, height} => parses successfully with defaults', () => {
      const state = WindowStateStub();

      const result = windowStateContract.parse(state);

      expect(result).toStrictEqual({
        width: 1500,
        height: 800,
      });
    });

    it('VALID: {width, height, x, y, isMaximized, isFullScreen} => parses full window state', () => {
      const state = WindowStateStub({
        width: 1200,
        height: 900,
        x: 100,
        y: 200,
        isMaximized: true,
        isFullScreen: false,
      });

      const result = windowStateContract.parse(state);

      expect(result).toStrictEqual({
        width: 1200,
        height: 900,
        x: 100,
        y: 200,
        isMaximized: true,
        isFullScreen: false,
      });
    });

    it('VALID: {negative coordinates} => allows negative x and y for multi-monitor setups', () => {
      const state = WindowStateStub({
        width: 1500,
        height: 800,
        x: -1920,
        y: -100,
      });

      const result = windowStateContract.parse(state);

      expect(result).toStrictEqual({
        width: 1500,
        height: 800,
        x: -1920,
        y: -100,
      });
    });
  });

  describe('invalid window state', () => {
    it('INVALID: {non-positive width} => throws validation error', () => {
      expect(() => {
        return windowStateContract.parse({ width: 0, height: 800 });
      }).toThrow(/expected number to be >0/u);
    });

    it('INVALID: {non-positive height} => throws validation error', () => {
      expect(() => {
        return windowStateContract.parse({ width: 1500, height: -10 });
      }).toThrow(/expected number to be >0/u);
    });

    it('INVALID: {missing width} => throws validation error', () => {
      expect(() => {
        return windowStateContract.parse({ height: 800 });
      }).toThrow(/Invalid input: expected number, received undefined/u);
    });
  });
});
