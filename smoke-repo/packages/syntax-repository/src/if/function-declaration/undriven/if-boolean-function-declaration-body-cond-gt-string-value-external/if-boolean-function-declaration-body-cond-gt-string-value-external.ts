export function ifBooleanFunctionDeclarationBodyCondGtStringValueExternal(): string {
    if ((process.argv[2] ?? '') > 'm') {
        return 'then';
    }
    return 'else';
}
