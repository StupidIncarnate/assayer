const receiver: readonly boolean[] = [true, false, true];

const ifNumberDefaultExportCondArrayLengthBooleanReceiverConst = (): string => {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};

export default ifNumberDefaultExportCondArrayLengthBooleanReceiverConst;
