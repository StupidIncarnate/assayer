const receiver: readonly number[] = [10, 20, 30];

export function ifNumberFunctionDeclarationBodyCondArrayLengthNumberReceiverConst(): string {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
}
