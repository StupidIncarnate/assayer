export function ternaryNumberFunctionDeclarationBodyCondStringLengthReceiverExternal(): string {
    return (process.argv[2] ?? '').length ? 'then' : 'else';
}
