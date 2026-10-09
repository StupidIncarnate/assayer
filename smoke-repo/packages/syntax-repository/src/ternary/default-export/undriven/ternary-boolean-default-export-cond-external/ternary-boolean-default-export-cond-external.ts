const ternaryBooleanDefaultExportCondExternal = (): string => {
    return process.argv[2] === 'yes' ? 'then' : 'else';
};

export default ternaryBooleanDefaultExportCondExternal;
