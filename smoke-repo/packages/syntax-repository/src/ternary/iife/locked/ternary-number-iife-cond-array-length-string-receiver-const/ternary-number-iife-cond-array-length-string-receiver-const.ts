const receiver: readonly string[] = ['a', 'b', 'c'];

export const ternaryNumberIifeCondArrayLengthStringReceiverConst = ((): string => {
    return receiver.length ? 'then' : 'else';
})();
