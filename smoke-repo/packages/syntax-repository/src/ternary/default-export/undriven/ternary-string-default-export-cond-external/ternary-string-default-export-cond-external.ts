const ternaryStringDefaultExportCondExternal = (): string => {
    return process.argv[2] ?? '' ? 'then' : 'else';
};

export default ternaryStringDefaultExportCondExternal;
