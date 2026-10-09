const ifBooleanDefaultExportCondNullishBooleanValueParam = (value: boolean | undefined): string => {
    if (value ?? false) {
        return 'then';
    }
    return 'else';
};

export default ifBooleanDefaultExportCondNullishBooleanValueParam;
