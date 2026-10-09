const value: string = 'abc';

export function ifBooleanFunctionDeclarationBodyCondEqStringValueConst(): string {
    if (value === 'xyz') {
        return 'then';
    }
    return 'else';
}
