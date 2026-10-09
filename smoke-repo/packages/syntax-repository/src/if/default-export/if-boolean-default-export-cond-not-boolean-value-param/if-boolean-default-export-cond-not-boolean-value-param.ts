const ifBooleanDefaultExportCondNotBooleanValueParam = (value: boolean): string => {
    if (!value) {
        return 'then';
    }
    return 'else';
};

export default ifBooleanDefaultExportCondNotBooleanValueParam;
