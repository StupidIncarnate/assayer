export function ifBooleanFunctionDeclarationBodyCondNotBooleanValueParam(value: boolean): string {
    if (!value) {
        return 'then';
    }
    return 'else';
}
