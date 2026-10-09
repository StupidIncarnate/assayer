const value: number = 3;

export function ternaryBooleanFunctionDeclarationDefaultParamCondNotNumberValueConst(label: string = !value ? 'then' : 'else'): string {
    return label;
}
