const ifNumberDefaultExportCondArrayLengthBooleanReceiverParam = (receiver: readonly boolean[]): string => {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};

export default ifNumberDefaultExportCondArrayLengthBooleanReceiverParam;
