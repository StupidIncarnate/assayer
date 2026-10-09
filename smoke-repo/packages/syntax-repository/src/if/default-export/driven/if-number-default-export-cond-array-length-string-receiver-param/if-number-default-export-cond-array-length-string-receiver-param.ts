const ifNumberDefaultExportCondArrayLengthStringReceiverParam = (receiver: readonly string[]): string => {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};

export default ifNumberDefaultExportCondArrayLengthStringReceiverParam;
