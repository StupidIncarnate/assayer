export function ifNumberFunctionDeclarationBodyCondParam(cond: number): string {
    if (cond) {
        return 'then';
    }
    return 'else';
}
