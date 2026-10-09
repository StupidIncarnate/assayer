const ternaryNumberDefaultExportCondStringLengthReceiverExternal = (): string => {
    return (process.argv[2] ?? '').length ? 'then' : 'else';
};

export default ternaryNumberDefaultExportCondStringLengthReceiverExternal;
