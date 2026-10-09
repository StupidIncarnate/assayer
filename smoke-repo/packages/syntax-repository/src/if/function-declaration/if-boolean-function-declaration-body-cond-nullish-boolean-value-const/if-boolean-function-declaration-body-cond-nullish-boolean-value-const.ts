const value: boolean | undefined = true;

export function ifBooleanFunctionDeclarationBodyCondNullishBooleanValueConst(): string {
    if (value ?? false) {
        return 'then';
    }
    return 'else';
}
