const receiver: readonly string[] = ['a', 'b', 'c'];

export function ternaryNumberFunctionDeclarationDefaultParamCondArrayLengthStringReceiverConst(label: string = receiver.length ? 'then' : 'else'): string {
    return label;
}
