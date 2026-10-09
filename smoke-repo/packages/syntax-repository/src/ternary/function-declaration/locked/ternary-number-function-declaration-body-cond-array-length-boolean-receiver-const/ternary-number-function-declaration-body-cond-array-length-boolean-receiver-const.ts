const receiver: readonly boolean[] = [true, false, true];

export function ternaryNumberFunctionDeclarationBodyCondArrayLengthBooleanReceiverConst(): string {
    return receiver.length ? 'then' : 'else';
}
