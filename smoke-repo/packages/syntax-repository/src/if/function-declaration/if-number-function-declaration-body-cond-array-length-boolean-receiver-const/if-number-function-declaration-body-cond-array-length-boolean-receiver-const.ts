const receiver: readonly boolean[] = [true, false, true];

export function ifNumberFunctionDeclarationBodyCondArrayLengthBooleanReceiverConst(): string {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
}
