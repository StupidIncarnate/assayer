const value: string = 'abc';

export function* ternaryBooleanGeneratorFunctionCondEqStringValueConst(): Generator<string> {
    yield value === 'xyz' ? 'then' : 'else';
}
