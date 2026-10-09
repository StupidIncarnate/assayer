const ifStringDefaultExportCondExternal = (): string => {
    if (process.argv[2] ?? '') {
        return 'then';
    }
    return 'else';
};

export default ifStringDefaultExportCondExternal;
