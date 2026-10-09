const receiver: readonly string[] = ['a', 'b', 'c'];

export function ifNumberFunctionDeclarationBodyCondArrayLengthStringReceiverConst(): string {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
}
