const value: boolean | undefined = true;

const ifBooleanDefaultExportCondNullishBooleanValueConst = (): string => {
    if (value ?? false) {
        return 'then';
    }
    return 'else';
};

export default ifBooleanDefaultExportCondNullishBooleanValueConst;
