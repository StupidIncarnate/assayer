const value: boolean = true;

export function ifBooleanFunctionDeclarationBodyCondNotBooleanValueConst(): string {
    if (!value) {
        return 'then';
    }
    return 'else';
}
