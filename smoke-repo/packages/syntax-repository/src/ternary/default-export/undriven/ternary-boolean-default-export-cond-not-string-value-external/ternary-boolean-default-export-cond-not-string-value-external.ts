const ternaryBooleanDefaultExportCondNotStringValueExternal = (): string => {
    return !(process.argv[2] ?? '') ? 'then' : 'else';
};

export default ternaryBooleanDefaultExportCondNotStringValueExternal;
