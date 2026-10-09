const ternaryBooleanDefaultExportCondGtStringValueExternal = (): string => {
    return (process.argv[2] ?? '') > 'm' ? 'then' : 'else';
};

export default ternaryBooleanDefaultExportCondGtStringValueExternal;
