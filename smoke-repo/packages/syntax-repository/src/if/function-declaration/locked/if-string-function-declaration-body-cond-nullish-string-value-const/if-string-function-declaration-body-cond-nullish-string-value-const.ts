const value: string | undefined = 'abc';

export function ifStringFunctionDeclarationBodyCondNullishStringValueConst(): string {
    if (value ?? '') {
        return 'then';
    }
    return 'else';
}
