const value: boolean = true;

export function ternaryBooleanFunctionDeclarationDefaultParamCondNotBooleanValueConst(label: string = !value ? 'then' : 'else'): string {
    return label;
}
