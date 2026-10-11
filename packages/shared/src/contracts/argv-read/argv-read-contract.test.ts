import { argvReadContract } from './argv-read-contract';
import { ArgvReadStub } from './argv-read.stub';

describe('argvReadContract', () => {
  it('VALID: {stub default} => parses the raw read of process.argv[2]', () => {
    const read = ArgvReadStub();

    const result = argvReadContract.parse(read);

    expect(result).toStrictEqual({ shape: 'element', index: 2, steps: [] });
  });

  it('VALID: {shape: "tail", index: 2, steps: [map]} => parses process.argv.slice(2).map(f)', () => {
    const result = argvReadContract.parse({ shape: 'tail', index: 2, steps: [{ kind: 'map' }] });

    expect(result).toStrictEqual({ shape: 'tail', index: 2, steps: [{ kind: 'map' }] });
  });

  it('INVALID: {index: -1} => throws', () => {
    expect(() => argvReadContract.parse({ shape: 'element', index: -1, steps: [] })).toThrow(/Too small: expected number to be >=0/u);
  });

  it('INVALID: {shape: "whole"} => throws', () => {
    expect(() => argvReadContract.parse({ shape: 'whole', index: 2, steps: [] })).toThrow(/Invalid option: expected one of/u);
  });
});
