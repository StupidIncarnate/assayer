export function ifBooleanFunctionDeclarationBodyCondEqBooleanValueParam(value: boolean): string {
    if (value === false) {
        return 'then';
    }
    return 'else';
}
