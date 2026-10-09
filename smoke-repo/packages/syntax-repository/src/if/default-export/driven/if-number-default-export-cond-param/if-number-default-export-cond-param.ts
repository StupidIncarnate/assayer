const ifNumberDefaultExportCondParam = (cond: number): string => {
    if (cond) {
        return 'then';
    }
    return 'else';
};

export default ifNumberDefaultExportCondParam;
