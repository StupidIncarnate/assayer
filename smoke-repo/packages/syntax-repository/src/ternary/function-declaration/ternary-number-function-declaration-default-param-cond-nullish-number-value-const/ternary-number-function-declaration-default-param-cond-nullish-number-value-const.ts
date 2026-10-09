const value: number | undefined = 3;

export function ternaryNumberFunctionDeclarationDefaultParamCondNullishNumberValueConst(label: string = value ?? 0 ? 'then' : 'else'): string {
    return label;
}
