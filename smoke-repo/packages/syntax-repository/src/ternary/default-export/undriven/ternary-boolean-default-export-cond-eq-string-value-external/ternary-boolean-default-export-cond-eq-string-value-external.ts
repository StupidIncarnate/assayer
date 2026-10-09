const ternaryBooleanDefaultExportCondEqStringValueExternal = (): string => {
    return (process.argv[2] ?? '') === 'xyz' ? 'then' : 'else';
};

export default ternaryBooleanDefaultExportCondEqStringValueExternal;
