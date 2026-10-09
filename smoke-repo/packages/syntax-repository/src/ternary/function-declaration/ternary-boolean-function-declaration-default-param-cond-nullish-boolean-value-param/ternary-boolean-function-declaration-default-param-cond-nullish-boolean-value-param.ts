export function ternaryBooleanFunctionDeclarationDefaultParamCondNullishBooleanValueParam(value: boolean | undefined, label: string = value ?? false ? 'then' : 'else'): string {
    return label;
}
