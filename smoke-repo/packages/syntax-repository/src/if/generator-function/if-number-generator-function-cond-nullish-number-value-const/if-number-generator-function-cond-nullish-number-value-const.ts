const value: number | undefined = 3;

export function* ifNumberGeneratorFunctionCondNullishNumberValueConst(): Generator<string> {
    if (value ?? 0) {
        yield 'then';
    }
    yield 'else';
}
