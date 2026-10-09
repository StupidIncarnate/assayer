export function* ifStringGeneratorFunctionCondNullishStringValueParam(value: string | undefined): Generator<string> {
    if (value ?? '') {
        yield 'then';
    }
    yield 'else';
}
