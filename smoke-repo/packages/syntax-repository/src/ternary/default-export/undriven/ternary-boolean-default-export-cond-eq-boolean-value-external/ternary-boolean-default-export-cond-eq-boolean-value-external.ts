const ternaryBooleanDefaultExportCondEqBooleanValueExternal = (): string => {
    return process.argv[2] === 'yes' === false ? 'then' : 'else';
};

export default ternaryBooleanDefaultExportCondEqBooleanValueExternal;
