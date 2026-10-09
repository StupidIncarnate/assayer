export function ifStringFunctionDeclarationBodyCondNullishStringValueParam(value: string | undefined): string {
    if (value ?? '') {
        return 'then';
    }
    return 'else';
}
