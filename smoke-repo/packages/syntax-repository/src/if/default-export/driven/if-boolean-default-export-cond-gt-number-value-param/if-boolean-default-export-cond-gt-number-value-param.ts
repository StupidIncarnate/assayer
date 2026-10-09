const ifBooleanDefaultExportCondGtNumberValueParam = (value: number): string => {
    if (value > 5) {
        return 'then';
    }
    return 'else';
};

export default ifBooleanDefaultExportCondGtNumberValueParam;
