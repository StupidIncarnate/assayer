const ifBooleanDefaultExportCondEqNumberValueParam = (value: number): string => {
    if (value === 7) {
        return 'then';
    }
    return 'else';
};

export default ifBooleanDefaultExportCondEqNumberValueParam;
