import { representativeValueStatics } from './representative-value-statics';

describe('representativeValueStatics', () => {
  it('VALID: {defaults} => 7, a multi-character string, and false', () => {
    expect(representativeValueStatics).toStrictEqual({ number: 7, string: 'abc123', boolean: false });
  });
});
