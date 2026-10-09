const receiver: readonly boolean[] = [true, false, true];

export function ternaryNumberFunctionDeclarationDefaultParamCondArrayLengthBooleanReceiverConst(label: string = receiver.length ? 'then' : 'else'): string {
    return label;
}
