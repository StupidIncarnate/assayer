export function* ternaryNumberGeneratorFunctionCondNullishNumberValueParam(value: number | undefined): Generator<string> {
    yield value ?? 0 ? 'then' : 'else';
}
