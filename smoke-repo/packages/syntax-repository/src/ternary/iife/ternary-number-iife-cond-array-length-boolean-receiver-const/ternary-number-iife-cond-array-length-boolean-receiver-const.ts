const receiver: readonly boolean[] = [true, false, true];

export const ternaryNumberIifeCondArrayLengthBooleanReceiverConst = ((): string => {
    return receiver.length ? 'then' : 'else';
})();
