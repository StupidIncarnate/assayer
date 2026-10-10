import { windowNormalBoundsTransformer } from './window-normal-bounds-transformer';

describe('windowNormalBoundsTransformer', () => {
  it('VALID: {exact integers} => returns unchanged dimensions', () => {
    const result = windowNormalBoundsTransformer({
      bounds: { x: 100, y: 200, width: 1500, height: 800 },
    });

    expect(result).toStrictEqual({
      x: 100,
      y: 200,
      width: 1500,
      height: 800,
    });
  });

  it('VALID: {fractional coordinates from scaling} => rounds coordinates and sizes to integers', () => {
    const result = windowNormalBoundsTransformer({
      bounds: { x: 100.4, y: 200.6, width: 1499.7, height: 799.2 },
    });

    expect(result).toStrictEqual({
      x: 100,
      y: 201,
      width: 1500,
      height: 799,
    });
  });

  it('VALID: {dimensions less than 1} => clamps to minimum dimension 1', () => {
    const result = windowNormalBoundsTransformer({
      bounds: { x: 0, y: 0, width: 0, height: -10 },
    });

    expect(result).toStrictEqual({
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    });
  });
});
