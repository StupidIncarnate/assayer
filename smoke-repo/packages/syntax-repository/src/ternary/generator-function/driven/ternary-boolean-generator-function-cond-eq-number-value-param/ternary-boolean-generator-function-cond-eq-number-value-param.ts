export function* ternaryBooleanGeneratorFunctionCondEqNumberValueParam(value: number): Generator<string> {
    yield value === 7 ? 'then' : 'else';
}
