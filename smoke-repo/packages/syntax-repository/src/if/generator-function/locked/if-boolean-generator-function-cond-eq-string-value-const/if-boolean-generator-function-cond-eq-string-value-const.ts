const value: string = 'abc';

export function* ifBooleanGeneratorFunctionCondEqStringValueConst(): Generator<string> {
    if (value === 'xyz') {
        yield 'then';
    }
    yield 'else';
}
