const value: number = 3;

export function ifBooleanFunctionDeclarationBodyCondEqNumberValueConst(): string {
    if (value === 7) {
        return 'then';
    }
    return 'else';
}
