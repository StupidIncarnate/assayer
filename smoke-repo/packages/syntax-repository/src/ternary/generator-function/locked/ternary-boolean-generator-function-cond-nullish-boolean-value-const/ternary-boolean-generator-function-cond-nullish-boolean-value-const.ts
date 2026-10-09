const value: boolean | undefined = true;

export function* ternaryBooleanGeneratorFunctionCondNullishBooleanValueConst(): Generator<string> {
    yield value ?? false ? 'then' : 'else';
}
