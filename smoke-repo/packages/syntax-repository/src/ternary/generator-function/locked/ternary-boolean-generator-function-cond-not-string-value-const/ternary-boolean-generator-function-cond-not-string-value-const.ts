const value: string = 'abc';

export function* ternaryBooleanGeneratorFunctionCondNotStringValueConst(): Generator<string> {
    yield !value ? 'then' : 'else';
}
