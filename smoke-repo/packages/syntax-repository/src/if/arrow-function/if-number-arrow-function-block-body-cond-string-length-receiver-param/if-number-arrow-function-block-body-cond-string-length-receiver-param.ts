export const ifNumberArrowFunctionBlockBodyCondStringLengthReceiverParam = (receiver: string): string => {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};
