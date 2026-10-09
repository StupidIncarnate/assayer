export function ifBooleanFunctionDeclarationBodyCondEqStringValueParam(value: string): string {
    if (value === 'xyz') {
        return 'then';
    }
    return 'else';
}
