export function ternaryBooleanFunctionDeclarationBodyCondNotStringValueExternal(): string {
    return !(process.argv[2] ?? '') ? 'then' : 'else';
}
