const value: number | undefined = 3;

const ifNumberDefaultExportCondNullishNumberValueConst = (): string => {
    if (value ?? 0) {
        return 'then';
    }
    return 'else';
};

export default ifNumberDefaultExportCondNullishNumberValueConst;
