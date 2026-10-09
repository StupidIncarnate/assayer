const cond: number = 3;

export function ternaryNumberFunctionDeclarationDefaultParamCondConst(label: string = cond ? 'then' : 'else'): string {
    return label;
}
