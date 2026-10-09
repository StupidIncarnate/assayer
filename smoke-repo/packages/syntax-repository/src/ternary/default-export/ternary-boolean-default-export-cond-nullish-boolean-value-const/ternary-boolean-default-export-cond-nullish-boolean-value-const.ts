const value: boolean | undefined = true;

const ternaryBooleanDefaultExportCondNullishBooleanValueConst = (): string => {
    return value ?? false ? 'then' : 'else';
};

export default ternaryBooleanDefaultExportCondNullishBooleanValueConst;
