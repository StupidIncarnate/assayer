const value: boolean | undefined = true;

export function ternaryBooleanFunctionDeclarationDefaultParamCondNullishBooleanValueConst(label: string = value ?? false ? 'then' : 'else'): string {
    return label;
}
