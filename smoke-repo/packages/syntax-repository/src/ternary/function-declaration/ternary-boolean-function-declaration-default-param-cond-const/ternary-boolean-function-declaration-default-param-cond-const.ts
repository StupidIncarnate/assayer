const cond: boolean = true;

export function ternaryBooleanFunctionDeclarationDefaultParamCondConst(label: string = cond ? 'then' : 'else'): string {
    return label;
}
