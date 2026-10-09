const value: string = 'abc';

export function ifBooleanFunctionDeclarationBodyCondNotStringValueConst(): string {
    if (!value) {
        return 'then';
    }
    return 'else';
}
