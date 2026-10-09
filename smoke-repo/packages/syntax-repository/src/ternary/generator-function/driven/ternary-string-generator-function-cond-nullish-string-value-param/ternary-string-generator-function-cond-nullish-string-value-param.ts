export function* ternaryStringGeneratorFunctionCondNullishStringValueParam(value: string | undefined): Generator<string> {
    yield value ?? '' ? 'then' : 'else';
}
