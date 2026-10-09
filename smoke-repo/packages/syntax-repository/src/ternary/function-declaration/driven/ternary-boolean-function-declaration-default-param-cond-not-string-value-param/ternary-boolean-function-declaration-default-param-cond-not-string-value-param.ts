export function ternaryBooleanFunctionDeclarationDefaultParamCondNotStringValueParam(value: string, label: string = !value ? 'then' : 'else'): string {
    return label;
}
