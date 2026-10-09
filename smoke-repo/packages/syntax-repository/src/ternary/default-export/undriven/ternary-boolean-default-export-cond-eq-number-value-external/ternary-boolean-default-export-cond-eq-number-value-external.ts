const ternaryBooleanDefaultExportCondEqNumberValueExternal = (): string => {
    return Number(process.argv[2]) === 7 ? 'then' : 'else';
};

export default ternaryBooleanDefaultExportCondEqNumberValueExternal;
