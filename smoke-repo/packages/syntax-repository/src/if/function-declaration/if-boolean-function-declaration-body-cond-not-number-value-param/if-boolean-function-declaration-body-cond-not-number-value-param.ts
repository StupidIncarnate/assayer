export function ifBooleanFunctionDeclarationBodyCondNotNumberValueParam(value: number): string {
    if (!value) {
        return 'then';
    }
    return 'else';
}
