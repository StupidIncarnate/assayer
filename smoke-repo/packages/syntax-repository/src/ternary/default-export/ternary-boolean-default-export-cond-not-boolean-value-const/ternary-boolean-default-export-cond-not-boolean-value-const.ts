const value: boolean = true;

const ternaryBooleanDefaultExportCondNotBooleanValueConst = (): string => {
    return !value ? 'then' : 'else';
};

export default ternaryBooleanDefaultExportCondNotBooleanValueConst;
