const value: number | undefined = 3;

export function* ternaryNumberGeneratorFunctionCondNullishNumberValueConst(): Generator<string> {
    yield value ?? 0 ? 'then' : 'else';
}
