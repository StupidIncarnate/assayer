export function ifNumberFunctionDeclarationBodyCondNullishNumberValueParam(value: number | undefined): string {
    if (value ?? 0) {
        return 'then';
    }
    return 'else';
}
