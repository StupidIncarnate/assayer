const ifStringDefaultExportCondParam = (cond: string): string => {
    if (cond) {
        return 'then';
    }
    return 'else';
};

export default ifStringDefaultExportCondParam;
