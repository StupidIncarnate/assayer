const value: number | undefined = 3;

export function ifNumberFunctionDeclarationBodyCondNullishNumberValueConst(): string {
    if (value ?? 0) {
        return 'then';
    }
    return 'else';
}
