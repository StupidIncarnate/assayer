const ifBooleanDefaultExportCondNotStringValueExternal = (): string => {
    if (!(process.argv[2] ?? '')) {
        return 'then';
    }
    return 'else';
};

export default ifBooleanDefaultExportCondNotStringValueExternal;
