const ternaryStringDefaultExportCondNullishStringValueExternal = (): string => {
    return (process.argv[2] === undefined ? undefined : process.argv[2] ?? '') ?? '' ? 'then' : 'else';
};

export default ternaryStringDefaultExportCondNullishStringValueExternal;
