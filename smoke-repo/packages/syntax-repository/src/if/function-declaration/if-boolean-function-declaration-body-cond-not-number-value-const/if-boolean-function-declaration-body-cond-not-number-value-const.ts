const value: number = 3;

export function ifBooleanFunctionDeclarationBodyCondNotNumberValueConst(): string {
    if (!value) {
        return 'then';
    }
    return 'else';
}
