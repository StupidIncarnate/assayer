const receiver: readonly boolean[] = [true, false, true];

export const ifNumberArrowFunctionBlockBodyCondArrayLengthBooleanReceiverConst = (): string => {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};
