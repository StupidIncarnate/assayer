const cond: number = 3;

export function* ternaryNumberGeneratorFunctionCondConst(): Generator<string> {
    yield cond ? 'then' : 'else';
}
