export function ternaryStringFunctionDeclarationBodyCondExternal(): string {
    return process.argv[2] ?? '' ? 'then' : 'else';
}
