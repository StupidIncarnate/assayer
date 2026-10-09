const value: string = 'abc';

const ifBooleanDefaultExportCondGtStringValueConst = (): string => {
    if (value > 'm') {
        return 'then';
    }
    return 'else';
};

export default ifBooleanDefaultExportCondGtStringValueConst;
