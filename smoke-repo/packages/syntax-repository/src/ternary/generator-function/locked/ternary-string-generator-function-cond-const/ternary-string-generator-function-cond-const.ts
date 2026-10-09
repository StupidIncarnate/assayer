const cond: string = 'abc';

export function* ternaryStringGeneratorFunctionCondConst(): Generator<string> {
    yield cond ? 'then' : 'else';
}
