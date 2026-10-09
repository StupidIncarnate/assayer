export function* ifNumberGeneratorFunctionCondNullishNumberValueParam(value: number | undefined): Generator<string> {
    if (value ?? 0) {
        yield 'then';
    }
    yield 'else';
}
