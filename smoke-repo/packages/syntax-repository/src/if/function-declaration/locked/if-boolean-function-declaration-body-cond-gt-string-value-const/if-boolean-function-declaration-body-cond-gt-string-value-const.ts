const value: string = 'abc';

export function ifBooleanFunctionDeclarationBodyCondGtStringValueConst(): string {
    if (value > 'm') {
        return 'then';
    }
    return 'else';
}
