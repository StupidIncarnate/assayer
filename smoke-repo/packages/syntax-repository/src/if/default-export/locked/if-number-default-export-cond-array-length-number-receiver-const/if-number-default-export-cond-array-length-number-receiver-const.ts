const receiver: readonly number[] = [10, 20, 30];

const ifNumberDefaultExportCondArrayLengthNumberReceiverConst = (): string => {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};

export default ifNumberDefaultExportCondArrayLengthNumberReceiverConst;
