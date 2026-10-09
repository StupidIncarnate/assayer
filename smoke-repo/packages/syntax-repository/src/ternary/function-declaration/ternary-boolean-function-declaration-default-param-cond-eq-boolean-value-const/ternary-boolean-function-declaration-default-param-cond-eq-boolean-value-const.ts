const value: boolean = true;

export function ternaryBooleanFunctionDeclarationDefaultParamCondEqBooleanValueConst(label: string = value === false ? 'then' : 'else'): string {
    return label;
}
