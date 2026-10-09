const ifNumberDefaultExportCondExternal = (): string => {
    if (Number(process.argv[2])) {
        return 'then';
    }
    return 'else';
};

export default ifNumberDefaultExportCondExternal;
