const ifBooleanDefaultExportCondNotNumberValueParam = (value: number): string => {
    if (!value) {
        return 'then';
    }
    return 'else';
};

export default ifBooleanDefaultExportCondNotNumberValueParam;
