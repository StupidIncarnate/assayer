const receiver: readonly string[] = ['a', 'b', 'c'];

export function ternaryNumberFunctionDeclarationBodyCondArrayLengthStringReceiverConst(): string {
    return receiver.length ? 'then' : 'else';
}
