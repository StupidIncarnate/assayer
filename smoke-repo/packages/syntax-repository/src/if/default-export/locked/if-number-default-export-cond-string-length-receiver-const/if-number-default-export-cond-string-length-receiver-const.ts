const receiver: string = 'abc';

const ifNumberDefaultExportCondStringLengthReceiverConst = (): string => {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};

export default ifNumberDefaultExportCondStringLengthReceiverConst;
