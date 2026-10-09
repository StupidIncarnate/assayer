const ifNumberDefaultExportCondStringLengthReceiverParam = (receiver: string): string => {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};

export default ifNumberDefaultExportCondStringLengthReceiverParam;
