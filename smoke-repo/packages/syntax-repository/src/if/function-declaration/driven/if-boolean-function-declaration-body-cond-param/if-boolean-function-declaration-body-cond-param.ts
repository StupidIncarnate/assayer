export function ifBooleanFunctionDeclarationBodyCondParam(cond: boolean): string {
    if (cond) {
        return 'then';
    }
    return 'else';
}
