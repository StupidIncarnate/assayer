const value: number = 3;

const ifBooleanDefaultExportCondNotNumberValueConst = (): string => {
    if (!value) {
        return 'then';
    }
    return 'else';
};

export default ifBooleanDefaultExportCondNotNumberValueConst;
