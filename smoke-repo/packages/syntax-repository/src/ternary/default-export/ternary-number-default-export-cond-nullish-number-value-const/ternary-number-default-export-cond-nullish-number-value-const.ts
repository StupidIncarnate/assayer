const value: number | undefined = 3;

const ternaryNumberDefaultExportCondNullishNumberValueConst = (): string => {
    return value ?? 0 ? 'then' : 'else';
};

export default ternaryNumberDefaultExportCondNullishNumberValueConst;
