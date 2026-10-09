const receiver: readonly string[] = ['a', 'b', 'c'];

const ifNumberDefaultExportCondArrayLengthStringReceiverConst = (): string => {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};

export default ifNumberDefaultExportCondArrayLengthStringReceiverConst;
