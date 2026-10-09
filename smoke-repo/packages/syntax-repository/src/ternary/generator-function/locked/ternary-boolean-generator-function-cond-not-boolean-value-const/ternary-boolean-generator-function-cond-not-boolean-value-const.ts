const value: boolean = true;

export function* ternaryBooleanGeneratorFunctionCondNotBooleanValueConst(): Generator<string> {
    yield !value ? 'then' : 'else';
}
