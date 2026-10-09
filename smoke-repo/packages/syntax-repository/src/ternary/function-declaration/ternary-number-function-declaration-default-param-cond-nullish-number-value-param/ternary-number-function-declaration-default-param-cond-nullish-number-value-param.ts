export function ternaryNumberFunctionDeclarationDefaultParamCondNullishNumberValueParam(value: number | undefined, label: string = value ?? 0 ? 'then' : 'else'): string {
    return label;
}
