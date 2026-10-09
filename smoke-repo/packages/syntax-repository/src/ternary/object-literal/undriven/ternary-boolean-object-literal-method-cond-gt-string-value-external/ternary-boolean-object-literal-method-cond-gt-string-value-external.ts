export const ternaryBooleanObjectLiteralMethodCondGtStringValueExternal = {
    run(): string {
        return (process.argv[2] ?? '') > 'm' ? 'then' : 'else';
    },
};
