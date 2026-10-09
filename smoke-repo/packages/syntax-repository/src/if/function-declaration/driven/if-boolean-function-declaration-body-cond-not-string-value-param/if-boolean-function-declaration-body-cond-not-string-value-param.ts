export function ifBooleanFunctionDeclarationBodyCondNotStringValueParam(value: string): string {
    if (!value) {
        return 'then';
    }
    return 'else';
}
