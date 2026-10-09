const value: string = 'abc';

export function ternaryBooleanFunctionDeclarationDefaultParamCondNotStringValueConst(label: string = !value ? 'then' : 'else'): string {
    return label;
}
