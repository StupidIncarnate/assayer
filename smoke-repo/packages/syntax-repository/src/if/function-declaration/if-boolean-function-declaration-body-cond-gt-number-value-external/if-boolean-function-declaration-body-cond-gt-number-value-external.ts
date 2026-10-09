export function ifBooleanFunctionDeclarationBodyCondGtNumberValueExternal(): string {
    if (Number(process.argv[2]) > 5) {
        return 'then';
    }
    return 'else';
}
