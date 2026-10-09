export function* ternaryBooleanGeneratorFunctionCondEqBooleanValueParam(value: boolean): Generator<string> {
    yield value === false ? 'then' : 'else';
}
