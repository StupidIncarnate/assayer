export function ifNumberFunctionDeclarationBodyCondArrayLengthBooleanReceiverParam(receiver: readonly boolean[]): string {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
}
