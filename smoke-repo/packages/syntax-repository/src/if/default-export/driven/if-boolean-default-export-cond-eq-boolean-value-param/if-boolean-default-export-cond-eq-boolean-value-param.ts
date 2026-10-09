const ifBooleanDefaultExportCondEqBooleanValueParam = (value: boolean): string => {
    if (value === false) {
        return 'then';
    }
    return 'else';
};

export default ifBooleanDefaultExportCondEqBooleanValueParam;
