const receiver: string = 'abc';

export const ifNumberArrowFunctionBlockBodyCondStringLengthReceiverConst = (): string => {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};
