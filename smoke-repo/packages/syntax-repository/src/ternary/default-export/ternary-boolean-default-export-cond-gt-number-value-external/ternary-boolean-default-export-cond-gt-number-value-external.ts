const ternaryBooleanDefaultExportCondGtNumberValueExternal = (): string => {
    return Number(process.argv[2]) > 5 ? 'then' : 'else';
};

export default ternaryBooleanDefaultExportCondGtNumberValueExternal;
