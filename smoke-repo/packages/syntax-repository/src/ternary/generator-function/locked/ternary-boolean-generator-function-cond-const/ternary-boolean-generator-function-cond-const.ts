const cond: boolean = true;

export function* ternaryBooleanGeneratorFunctionCondConst(): Generator<string> {
    yield cond ? 'then' : 'else';
}
