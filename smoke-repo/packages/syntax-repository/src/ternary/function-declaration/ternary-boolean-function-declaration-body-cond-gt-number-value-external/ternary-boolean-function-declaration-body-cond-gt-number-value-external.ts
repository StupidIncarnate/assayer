export function ternaryBooleanFunctionDeclarationBodyCondGtNumberValueExternal(): string {
    return Number(process.argv[2]) > 5 ? 'then' : 'else';
}
