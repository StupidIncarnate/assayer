export function ternaryBooleanFunctionDeclarationDefaultParamCondNotBooleanValueParam(value: boolean, label: string = !value ? 'then' : 'else'): string {
    return label;
}
