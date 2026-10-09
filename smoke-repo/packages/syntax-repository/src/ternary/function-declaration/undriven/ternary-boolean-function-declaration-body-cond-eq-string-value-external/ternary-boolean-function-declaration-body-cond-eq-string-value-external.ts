export function ternaryBooleanFunctionDeclarationBodyCondEqStringValueExternal(): string {
    return (process.argv[2] ?? '') === 'xyz' ? 'then' : 'else';
}
