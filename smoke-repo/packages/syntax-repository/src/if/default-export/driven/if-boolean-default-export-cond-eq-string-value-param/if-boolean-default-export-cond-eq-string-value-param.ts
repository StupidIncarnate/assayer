const ifBooleanDefaultExportCondEqStringValueParam = (value: string): string => {
    if (value === 'xyz') {
        return 'then';
    }
    return 'else';
};

export default ifBooleanDefaultExportCondEqStringValueParam;
