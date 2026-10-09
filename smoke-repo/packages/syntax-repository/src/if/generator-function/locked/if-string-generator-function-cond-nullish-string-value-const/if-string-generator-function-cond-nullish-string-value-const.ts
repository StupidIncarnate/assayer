const value: string | undefined = 'abc';

export function* ifStringGeneratorFunctionCondNullishStringValueConst(): Generator<string> {
    if (value ?? '') {
        yield 'then';
    }
    yield 'else';
}
