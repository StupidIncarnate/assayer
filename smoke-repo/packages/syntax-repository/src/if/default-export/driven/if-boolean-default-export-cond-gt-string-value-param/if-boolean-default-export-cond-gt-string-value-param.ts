const ifBooleanDefaultExportCondGtStringValueParam = (value: string): string => {
    if (value > 'm') {
        return 'then';
    }
    return 'else';
};

export default ifBooleanDefaultExportCondGtStringValueParam;
