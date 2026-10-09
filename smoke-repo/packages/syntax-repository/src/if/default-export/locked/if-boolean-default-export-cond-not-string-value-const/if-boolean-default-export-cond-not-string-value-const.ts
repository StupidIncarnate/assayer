const value: string = 'abc';

const ifBooleanDefaultExportCondNotStringValueConst = (): string => {
    if (!value) {
        return 'then';
    }
    return 'else';
};

export default ifBooleanDefaultExportCondNotStringValueConst;
