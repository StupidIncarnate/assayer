export function ternaryNumberFunctionDeclarationBodyCondExternal(): string {
    return Number(process.argv[2]) ? 'then' : 'else';
}
