const value: string | undefined = 'abc';

const ternaryStringDefaultExportCondNullishStringValueConst = (): string => {
    return value ?? '' ? 'then' : 'else';
};

export default ternaryStringDefaultExportCondNullishStringValueConst;
