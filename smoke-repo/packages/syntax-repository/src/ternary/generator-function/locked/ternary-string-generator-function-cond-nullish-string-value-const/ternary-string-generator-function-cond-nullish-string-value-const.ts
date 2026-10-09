const value: string | undefined = 'abc';

export function* ternaryStringGeneratorFunctionCondNullishStringValueConst(): Generator<string> {
    yield value ?? '' ? 'then' : 'else';
}
