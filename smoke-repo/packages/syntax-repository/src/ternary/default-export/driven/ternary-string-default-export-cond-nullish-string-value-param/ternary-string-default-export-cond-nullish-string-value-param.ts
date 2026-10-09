const ternaryStringDefaultExportCondNullishStringValueParam = (value: string | undefined): string => {
    return value ?? '' ? 'then' : 'else';
};

export default ternaryStringDefaultExportCondNullishStringValueParam;
