export function ternaryBooleanFunctionDeclarationBodyCondEqBooleanValueExternal(): string {
    return process.argv[2] === 'yes' === false ? 'then' : 'else';
}
