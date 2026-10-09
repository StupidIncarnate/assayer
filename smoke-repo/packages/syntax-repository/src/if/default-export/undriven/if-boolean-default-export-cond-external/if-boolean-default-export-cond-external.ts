const ifBooleanDefaultExportCondExternal = (): string => {
    if (process.argv[2] === 'yes') {
        return 'then';
    }
    return 'else';
};

export default ifBooleanDefaultExportCondExternal;
