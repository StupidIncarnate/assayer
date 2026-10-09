const cond: number = 3;

const ifNumberDefaultExportCondConst = (): string => {
    if (cond) {
        return 'then';
    }
    return 'else';
};

export default ifNumberDefaultExportCondConst;
