export function ternaryBooleanFunctionDeclarationBodyCondExternal(): string {
    return process.argv[2] === 'yes' ? 'then' : 'else';
}
