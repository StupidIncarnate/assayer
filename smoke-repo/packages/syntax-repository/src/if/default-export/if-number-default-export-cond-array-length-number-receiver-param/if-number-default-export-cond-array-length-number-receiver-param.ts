const ifNumberDefaultExportCondArrayLengthNumberReceiverParam = (receiver: readonly number[]): string => {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};

export default ifNumberDefaultExportCondArrayLengthNumberReceiverParam;
