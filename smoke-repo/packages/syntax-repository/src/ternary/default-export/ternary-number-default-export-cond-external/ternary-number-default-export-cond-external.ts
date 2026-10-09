const ternaryNumberDefaultExportCondExternal = (): string => {
    return Number(process.argv[2]) ? 'then' : 'else';
};

export default ternaryNumberDefaultExportCondExternal;
