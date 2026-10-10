import { undrivenTerseReasonTransformer } from './undriven-terse-reason-transformer';

describe('undrivenTerseReasonTransformer', () => {
  it('VALID: {reason with unarrangeable operand} => extracts operand in terse message', () => {
    const reason =
      '`fn` has a branch on line 24 whose deciding value `process.argv[2]` is neither one of its parameters nor an environment variable, so no case can steer which arm runs';
    const result = undrivenTerseReasonTransformer({ reason });

    expect(result).toBe('Deciding value `process.argv[2]` is not a parameter or env var');
  });

  it('VALID: {reason with no operand unarrangeable} => returns condition has no parameter message', () => {
    const reason =
      '`fn` has a branch on line 24 whose deciding value is neither one of its parameters nor an environment variable, so no case can steer which arm runs';
    const result = undrivenTerseReasonTransformer({ reason });

    expect(result).toBe('Condition has no parameter or env var to steer it');
  });

  it('VALID: {reason with unread comparison} => returns compares against unreadable non-literal', () => {
    const reason =
      '`fn` has a branch on line 5 that compares `m` against a value Assayer could not read as a literal — an enum member, an imported or computed constant';
    const result = undrivenTerseReasonTransformer({ reason });

    expect(result).toBe('Compares `m` against unreadable non-literal');
  });

  it('VALID: {reason with unarrangeable typeof} => returns unarrangeable typeof read message', () => {
    const reason =
      '`fn` has a branch on line 3 whose deciding value is a `typeof` read, so no case can steer which arm runs';
    const result = undrivenTerseReasonTransformer({ reason });

    expect(result).toBe('Deciding value is an unarrangeable typeof read');
  });

  it('VALID: {reason with typeof member narrowing} => returns narrows typeof to unfillable union shape', () => {
    const reason =
      '`fn` has a branch on line 2 that reads `typeof target`, so no case can steer which arm runs; every matching member is a shape Assayer cannot yet select';
    const result = undrivenTerseReasonTransformer({ reason });

    expect(result).toBe('Narrows typeof `target` to an unfillable union shape');
  });

  it('VALID: {reason with import time module} => returns runs at import time', () => {
    const reason = 'it runs at import time, so no case drove its branches';
    const result = undrivenTerseReasonTransformer({ reason });

    expect(result).toBe('Runs at import time (no entry parameters)');
  });

  it('VALID: {reason with uncalled private} => returns private helper not called', () => {
    const reason = 'it is private and no reachable surface calls it';
    const result = undrivenTerseReasonTransformer({ reason });

    expect(result).toBe('Private helper not called by any reachable entry');
  });

  it('VALID: {reason with constructor requirement} => returns requires constructor arguments', () => {
    const reason = 'instance method requires constructor arguments';
    const result = undrivenTerseReasonTransformer({ reason });

    expect(result).toBe('Instance method requires constructor arguments');
  });

  it('VALID: {unknown reason format} => falls back to first phrase', () => {
    const reason = 'Some generic reason that is unexpected: more details here';
    const result = undrivenTerseReasonTransformer({ reason });

    expect(result).toBe('Some generic reason that is unexpected');
  });
});
