const ifBooleanDefaultExportCondGtStringValueExternal = (): string => {
    if ((process.argv[2] ?? '') > 'm') {
        return 'then';
    }
    return 'else';
};

export default ifBooleanDefaultExportCondGtStringValueExternal;
