const value: boolean = true;

const ifBooleanDefaultExportCondNotBooleanValueConst = (): string => {
    if (!value) {
        return 'then';
    }
    return 'else';
};

export default ifBooleanDefaultExportCondNotBooleanValueConst;
