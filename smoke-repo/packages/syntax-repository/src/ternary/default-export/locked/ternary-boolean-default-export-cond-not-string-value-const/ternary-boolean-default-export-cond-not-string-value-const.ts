const value: string = 'abc';

const ternaryBooleanDefaultExportCondNotStringValueConst = (): string => {
    return !value ? 'then' : 'else';
};

export default ternaryBooleanDefaultExportCondNotStringValueConst;
