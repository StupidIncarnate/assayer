const ifBooleanDefaultExportCondEqBooleanValueExternal = (): string => {
    if (process.argv[2] === 'yes' === false) {
        return 'then';
    }
    return 'else';
};

export default ifBooleanDefaultExportCondEqBooleanValueExternal;
