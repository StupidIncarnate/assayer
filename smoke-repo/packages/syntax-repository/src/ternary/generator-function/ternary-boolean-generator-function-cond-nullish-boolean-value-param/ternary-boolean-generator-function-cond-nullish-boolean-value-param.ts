export function* ternaryBooleanGeneratorFunctionCondNullishBooleanValueParam(value: boolean | undefined): Generator<string> {
    yield value ?? false ? 'then' : 'else';
}
