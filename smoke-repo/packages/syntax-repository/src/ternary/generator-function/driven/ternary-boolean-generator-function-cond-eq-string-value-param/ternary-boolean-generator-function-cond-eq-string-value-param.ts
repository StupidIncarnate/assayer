export function* ternaryBooleanGeneratorFunctionCondEqStringValueParam(value: string): Generator<string> {
    yield value === 'xyz' ? 'then' : 'else';
}
