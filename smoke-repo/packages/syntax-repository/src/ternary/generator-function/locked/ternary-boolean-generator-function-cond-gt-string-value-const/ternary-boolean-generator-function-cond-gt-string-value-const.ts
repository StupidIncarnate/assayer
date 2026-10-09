const value: string = 'abc';

export function* ternaryBooleanGeneratorFunctionCondGtStringValueConst(): Generator<string> {
    yield value > 'm' ? 'then' : 'else';
}
