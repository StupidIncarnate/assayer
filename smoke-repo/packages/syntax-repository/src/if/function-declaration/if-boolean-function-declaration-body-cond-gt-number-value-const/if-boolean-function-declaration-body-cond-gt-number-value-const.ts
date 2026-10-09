const value: number = 3;

export function ifBooleanFunctionDeclarationBodyCondGtNumberValueConst(): string {
    if (value > 5) {
        return 'then';
    }
    return 'else';
}
