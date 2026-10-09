export function ternaryBooleanFunctionDeclarationBodyCondNotNumberValueExternal(): string {
    return !Number(process.argv[2]) ? 'then' : 'else';
}
