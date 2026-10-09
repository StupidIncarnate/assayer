const value: boolean = true;

export function* ifBooleanGeneratorFunctionCondEqBooleanValueConst(): Generator<string> {
    if (value === false) {
        yield 'then';
    }
    yield 'else';
}
