const receiver: readonly number[] = [10, 20, 30];

export function ternaryNumberFunctionDeclarationDefaultParamCondArrayLengthNumberReceiverConst(label: string = receiver.length ? 'then' : 'else'): string {
    return label;
}
