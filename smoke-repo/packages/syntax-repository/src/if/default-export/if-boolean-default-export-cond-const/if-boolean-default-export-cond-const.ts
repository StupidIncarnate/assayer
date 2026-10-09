const cond: boolean = true;

const ifBooleanDefaultExportCondConst = (): string => {
    if (cond) {
        return 'then';
    }
    return 'else';
};

export default ifBooleanDefaultExportCondConst;
