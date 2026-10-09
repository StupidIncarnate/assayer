const value: boolean | undefined = true;

export function* ifBooleanGeneratorFunctionCondNullishBooleanValueConst(): Generator<string> {
    if (value ?? false) {
        yield 'then';
    }
    yield 'else';
}
