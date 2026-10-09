const value: string | undefined = 'abc';

const ifStringDefaultExportCondNullishStringValueConst = (): string => {
    if (value ?? '') {
        return 'then';
    }
    return 'else';
};

export default ifStringDefaultExportCondNullishStringValueConst;
