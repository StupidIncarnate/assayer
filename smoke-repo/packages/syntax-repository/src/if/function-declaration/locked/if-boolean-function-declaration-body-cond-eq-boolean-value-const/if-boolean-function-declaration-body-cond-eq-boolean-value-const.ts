const value: boolean = true;

export function ifBooleanFunctionDeclarationBodyCondEqBooleanValueConst(): string {
    if (value === false) {
        return 'then';
    }
    return 'else';
}
