const value: string = 'abc';

const ifBooleanDefaultExportCondEqStringValueConst = (): string => {
    if (value === 'xyz') {
        return 'then';
    }
    return 'else';
};

export default ifBooleanDefaultExportCondEqStringValueConst;
