export function ternaryBooleanFunctionDeclarationDefaultParamCondEqStringValueParam(value: string, label: string = value === 'xyz' ? 'then' : 'else'): string {
    return label;
}
