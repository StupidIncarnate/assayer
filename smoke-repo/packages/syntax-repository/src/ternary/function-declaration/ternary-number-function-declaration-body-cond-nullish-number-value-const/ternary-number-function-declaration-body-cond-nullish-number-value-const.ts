const value: number | undefined = 3;

export function ternaryNumberFunctionDeclarationBodyCondNullishNumberValueConst(): string {
    return value ?? 0 ? 'then' : 'else';
}
