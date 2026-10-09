export function ternaryStringFunctionDeclarationDefaultParamCondNullishStringValueParam(value: string | undefined, label: string = value ?? '' ? 'then' : 'else'): string {
    return label;
}
