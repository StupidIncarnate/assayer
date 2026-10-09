const ifBooleanDefaultExportCondEqStringValueExternal = (): string => {
    if ((process.argv[2] ?? '') === 'xyz') {
        return 'then';
    }
    return 'else';
};

export default ifBooleanDefaultExportCondEqStringValueExternal;
