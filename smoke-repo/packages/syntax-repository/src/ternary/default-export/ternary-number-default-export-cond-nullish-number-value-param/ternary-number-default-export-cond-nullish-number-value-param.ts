const ternaryNumberDefaultExportCondNullishNumberValueParam = (value: number | undefined): string => {
    return value ?? 0 ? 'then' : 'else';
};

export default ternaryNumberDefaultExportCondNullishNumberValueParam;
