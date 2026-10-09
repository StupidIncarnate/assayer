const cond: string = 'abc';

export function ternaryStringFunctionDeclarationDefaultParamCondConst(label: string = cond ? 'then' : 'else'): string {
    return label;
}
