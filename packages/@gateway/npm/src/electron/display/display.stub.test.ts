import { DisplayStub } from './display.stub';

describe('DisplayStub', () => {
  it('VALID: {default stub} => returns default display properties', () => {
    const display = DisplayStub();

    expect(display).toStrictEqual({
      id: 1,
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      workArea: { x: 0, y: 0, width: 1920, height: 1040 },
      scaleFactor: 1,
      rotation: 0,
      internal: true,
      monochrome: false,
      accelerometerSupport: 'unknown',
      colorDepth: 24,
      colorSpace: 'srgb',
      depthPerComponent: 8,
      detected: true,
      displayFrequency: 60,
      label: 'Primary Display',
      maximumCursorSize: { width: 32, height: 32 },
      nativeOrigin: { x: 0, y: 0 },
      size: { width: 1920, height: 1080 },
      touchSupport: 'unknown',
      workAreaSize: { width: 1920, height: 1040 },
    });
  });

  it('VALID: {custom bounds} => overrides specified properties', () => {
    const display = DisplayStub({
      id: 2,
      bounds: { x: 1920, y: 0, width: 2560, height: 1440 },
      label: 'Secondary Display',
    });

    expect(display).toStrictEqual({
      id: 2,
      bounds: { x: 1920, y: 0, width: 2560, height: 1440 },
      workArea: { x: 0, y: 0, width: 1920, height: 1040 },
      scaleFactor: 1,
      rotation: 0,
      internal: true,
      monochrome: false,
      accelerometerSupport: 'unknown',
      colorDepth: 24,
      colorSpace: 'srgb',
      depthPerComponent: 8,
      detected: true,
      displayFrequency: 60,
      label: 'Secondary Display',
      maximumCursorSize: { width: 32, height: 32 },
      nativeOrigin: { x: 0, y: 0 },
      size: { width: 1920, height: 1080 },
      touchSupport: 'unknown',
      workAreaSize: { width: 1920, height: 1040 },
    });
  });
});
