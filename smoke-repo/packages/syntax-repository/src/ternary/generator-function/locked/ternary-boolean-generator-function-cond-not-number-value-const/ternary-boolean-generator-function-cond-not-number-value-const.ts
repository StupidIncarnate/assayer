const value: number = 3;

export function* ternaryBooleanGeneratorFunctionCondNotNumberValueConst(): Generator<string> {
    yield !value ? 'then' : 'else';
}
