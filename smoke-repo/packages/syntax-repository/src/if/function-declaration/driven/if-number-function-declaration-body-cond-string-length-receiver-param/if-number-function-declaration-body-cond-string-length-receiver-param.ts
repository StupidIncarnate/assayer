export function ifNumberFunctionDeclarationBodyCondStringLengthReceiverParam(receiver: string): string {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
}
