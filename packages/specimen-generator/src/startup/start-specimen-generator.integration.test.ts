import { StartSpecimenGenerator } from './start-specimen-generator';

describe('StartSpecimenGenerator', () => {
  it('VALID: {command: "hello"} => resolves handled true', async () => {
    const result = await StartSpecimenGenerator({ command: 'hello' });

    expect(result).toStrictEqual({ handled: true });
  });

  it('EMPTY: {command: undefined} => resolves handled false', async () => {
    const result = await StartSpecimenGenerator({ command: undefined });

    expect(result).toStrictEqual({ handled: false });
  });
});
