export function ternaryBooleanFunctionDeclarationBodyCondGtStringValueExternal(): string {
    return (process.argv[2] ?? '') > 'm' ? 'then' : 'else';
}
