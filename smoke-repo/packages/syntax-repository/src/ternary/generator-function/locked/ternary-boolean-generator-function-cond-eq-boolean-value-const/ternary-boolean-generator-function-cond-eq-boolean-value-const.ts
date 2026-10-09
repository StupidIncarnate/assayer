const value: boolean = true;

export function* ternaryBooleanGeneratorFunctionCondEqBooleanValueConst(): Generator<string> {
    yield value === false ? 'then' : 'else';
}
