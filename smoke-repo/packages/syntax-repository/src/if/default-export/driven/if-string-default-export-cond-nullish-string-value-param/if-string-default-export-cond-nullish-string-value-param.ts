const ifStringDefaultExportCondNullishStringValueParam = (value: string | undefined): string => {
    if (value ?? '') {
        return 'then';
    }
    return 'else';
};

export default ifStringDefaultExportCondNullishStringValueParam;
