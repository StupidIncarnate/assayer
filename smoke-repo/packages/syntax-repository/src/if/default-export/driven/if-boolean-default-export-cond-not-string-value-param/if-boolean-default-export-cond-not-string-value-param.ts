const ifBooleanDefaultExportCondNotStringValueParam = (value: string): string => {
    if (!value) {
        return 'then';
    }
    return 'else';
};

export default ifBooleanDefaultExportCondNotStringValueParam;
