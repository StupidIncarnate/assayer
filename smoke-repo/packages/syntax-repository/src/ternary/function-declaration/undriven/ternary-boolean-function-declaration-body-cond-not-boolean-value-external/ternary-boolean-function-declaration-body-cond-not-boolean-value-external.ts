export function ternaryBooleanFunctionDeclarationBodyCondNotBooleanValueExternal(): string {
    return !(process.argv[2] === 'yes') ? 'then' : 'else';
}
