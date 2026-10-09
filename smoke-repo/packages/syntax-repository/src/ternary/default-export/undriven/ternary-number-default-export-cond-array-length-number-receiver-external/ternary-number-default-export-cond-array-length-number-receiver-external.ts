const ternaryNumberDefaultExportCondArrayLengthNumberReceiverExternal = (): string => {
    return process.argv.slice(2).map(Number).length ? 'then' : 'else';
};

export default ternaryNumberDefaultExportCondArrayLengthNumberReceiverExternal;
