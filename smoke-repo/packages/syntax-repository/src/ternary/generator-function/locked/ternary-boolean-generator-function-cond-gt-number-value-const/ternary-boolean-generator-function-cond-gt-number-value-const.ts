const value: number = 3;

export function* ternaryBooleanGeneratorFunctionCondGtNumberValueConst(): Generator<string> {
    yield value > 5 ? 'then' : 'else';
}
