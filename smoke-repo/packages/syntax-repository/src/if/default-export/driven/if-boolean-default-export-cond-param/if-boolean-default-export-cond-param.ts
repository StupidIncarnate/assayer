const ifBooleanDefaultExportCondParam = (cond: boolean): string => {
    if (cond) {
        return 'then';
    }
    return 'else';
};

export default ifBooleanDefaultExportCondParam;
