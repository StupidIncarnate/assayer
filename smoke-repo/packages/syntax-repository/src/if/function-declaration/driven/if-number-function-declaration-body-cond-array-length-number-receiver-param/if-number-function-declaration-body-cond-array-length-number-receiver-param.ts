export function ifNumberFunctionDeclarationBodyCondArrayLengthNumberReceiverParam(receiver: readonly number[]): string {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
}
