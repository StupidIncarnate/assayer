const ternaryBooleanDefaultExportCondNullishBooleanValueParam = (value: boolean | undefined): string => {
    return value ?? false ? 'then' : 'else';
};

export default ternaryBooleanDefaultExportCondNullishBooleanValueParam;
