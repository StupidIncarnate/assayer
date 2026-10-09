export function ifNumberFunctionDeclarationBodyCondArrayLengthStringReceiverParam(receiver: readonly string[]): string {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
}
